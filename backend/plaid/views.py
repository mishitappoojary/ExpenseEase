from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.db.models import Sum
from django.core.serializers.json import DjangoJSONEncoder
from backend.plaid.utils import plaid_config
from plaid.model.sandbox_item_reset_login_request import SandboxItemResetLoginRequest
from plaid.model.sandbox_item_fire_webhook_request import SandboxItemFireWebhookRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.liabilities_get_request import LiabilitiesGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from backend.plaid.webhooks import handle_item_webhook, handle_transactions_webhook, verify_webhook
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import Account, Item, Transaction, PlaidLinkEvent
import json
import logging
from django.conf import settings

# Initialize Plaid client
plaid_client = plaid_config.client

logger = logging.getLogger(__name__)

# ✅ Link Token Creation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_link_token(request):
    try:
        # Create a Link token for the given user
        request_user = LinkTokenCreateRequestUser(
            client_user_id=str(request.user.id)
        )
        
        # Directly use the lists from settings
        products = [Products(p) for p in settings.PLAID_PRODUCTS]
        country_codes = [CountryCode(c) for c in settings.PLAID_COUNTRY_CODES]

        request_config = LinkTokenCreateRequest(
            user=request_user,
            products=products,
            client_name=settings.CLIENT_NAME,
            country_codes=country_codes,
            language='en'
        )
        
        response = plaid_client.link_token_create(request_config)
        return Response({'link_token': response['link_token']})
    
    except Exception as e:
        logger.error(f"Error creating link token: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ✅ Token Exchange
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_public_token(request):
    try:
        public_token = request.data.get('public_token')
        if not public_token:
            return Response({"error": "public_token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        response = plaid_client.item_public_token_exchange(exchange_request)
        access_token = response['access_token']
        item_id = response['item_id']

        # Save to database
        Item.objects.create(
            user=request.user,
            access_token=access_token,
            item_id=item_id
        )
        return Response({'status': 'success', 'access_token': access_token, 'item_id': item_id})
    
    except Exception as e:
        logger.error(f"Error exchanging public token: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    pass

@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenRefreshView(TokenRefreshView):
    pass

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_liabilities(request):
    try:
        # Get the user's access token from the database
        item = Item.objects.filter(user=request.user).first()
        if not item:
            return Response({"error": "No Plaid item found for user"}, status=status.HTTP_404_NOT_FOUND)

        # Call the Plaid API to get liabilities
        liabilities_request = LiabilitiesGetRequest(access_token=item.access_token)
        response = plaid_client.liabilities_get(liabilities_request)
        
        return Response(response.to_dict())  # Convert response to JSON
    except Exception as e:
        logger.error(f"Error fetching liabilities: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ✅ Webhook Handling
@api_view(['POST'])
@permission_classes([AllowAny])
def plaid_webhook(request):

    try:
        if verify_webhook(request.body, request.headers):
            payload = json.loads(request.body)
            webhook_type = payload.get("webhook_type")
            webhook_code = payload.get("webhook_code")
            item_id = payload.get("item_id")
            error = payload.get("error")

            if webhook_type == "ITEM":
                handle_item_webhook(webhook_code, item_id, error)
            elif webhook_type == "TRANSACTIONS":
                handle_transactions_webhook(webhook_code, item_id)

            return Response({"message": "Webhook handled successfully."}, status=200)
        else:
            logger.info("Webhook didn't pass verification")
            return Response({"error": "Webhook verification failed."}, status=401)
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return Response({"error": "Something went wrong while handling the webhook."}, status=500)

# ✅ Sandbox Testing: Reset Login
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_sandbox_item_login(request):
    try:
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"error": "access_token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        reset_request = SandboxItemResetLoginRequest(access_token=access_token)
        plaid_client.sandbox_item_reset_login(reset_request)
        return Response({"message": "Sandbox item login reset successfully."}, status=200)
    
    except Exception as e:
        logger.error(f"Error resetting sandbox item login: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ✅ Sandbox Testing: Fire Webhook
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fire_sandbox_webhook(request):
    try:
        access_token = request.data.get("access_token")
        webhook_code = request.data.get("webhook_code", "NEW_ACCOUNTS_AVAILABLE")

        if not access_token:
            return Response({"error": "access_token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        fire_request = SandboxItemFireWebhookRequest(
            access_token=access_token,
            webhook_code=webhook_code
        )
        plaid_client.sandbox_item_fire_webhook(fire_request)
        return Response({"message": "Webhook fired successfully."}, status=200)
    
    except Exception as e:
        logger.error(f"Error firing sandbox webhook: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ✅ Dashboard View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    try:
        user = request.user
        items = Item.objects.filter(user=user)
        name_of_banks_connected = items.values_list("institution_name", flat=True)

        # Net worth across all banks
        net_worth = Account.objects.filter(item__user=user).aggregate(Sum("current_balance"))["current_balance__sum"]

        # Total income and total expense
        total_income = Transaction.objects.filter(account__item__user=user, amount__gt=0).aggregate(Sum("amount"))["amount__sum"]
        total_expense = Transaction.objects.filter(account__item__user=user, amount__lt=0).aggregate(Sum("amount"))["amount__sum"]

        # 5 Recent transactions
        transactions = Transaction.objects.filter(account__item__user=user).order_by('-date')[:5]

        # Category spending breakdown
        category_spending = (
            Transaction.objects.filter(account__item__user=user)
            .values("primary_personal_finance_category")
            .distinct()
            .order_by()
            .annotate(total_spending=Sum("amount"))
        )

        category_spending_json = json.dumps(list(category_spending), cls=DjangoJSONEncoder)

        response_data = {
            "items": list(items.values()),
            "no_of_banks": items.count(),
            "name_of_banks_connected": list(name_of_banks_connected),
            "net_worth": net_worth,
            "total_income": total_income,
            "total_expense": total_expense,
            "transactions": list(transactions.values()),
            "category_spending": list(category_spending),
            "category_spending_json": category_spending_json,
        }

        return Response(response_data)
    
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
