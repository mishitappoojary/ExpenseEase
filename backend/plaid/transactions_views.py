from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.db.models import Sum
import logging
import requests
from .models import Item, Transaction, Account
from .services import PlaidService, PlaidDatabaseService
from plaid.model.liabilities_get_request import LiabilitiesGetRequest
from .utils import plaid_config

logger = logging.getLogger(__name__)
plaid_client = plaid_config.client

class TransactionsView(APIView):
    permission_classes = [IsAuthenticated]
    # permission_classes = [] 

    def get(self, request):
        """
        Fetch all transactions for the authenticated user from Plaid.
        """
        try:
            user = request.user
            items = Item.objects.filter(user=user)
            transactions = []

            for item in items:
                plaid_service = PlaidService(item)
                fetched_transactions = plaid_service.fetch_transactions()[0]  # Get added transactions
                transactions.extend(fetched_transactions)

            return Response({'transactions': transactions})
        
        except Exception as e:
            logger.error(f"Error fetching transactions: {str(e)}")
            return Response({'error': 'Failed to fetch transactions'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AccountsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Fetch all accounts for the authenticated user from Plaid.
        """
        try:
            user = request.user
            items = Item.objects.filter(user=user)
            accounts = []

            for item in items:
                plaid_service = PlaidService(item)
                fetched_accounts = plaid_service.fetch_accounts()
                accounts.extend(fetched_accounts)

            return Response({'accounts': accounts})
        
        except Exception as e:
            logger.error(f"Error fetching accounts: {str(e)}")
            return Response({'error': 'Failed to fetch accounts'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class InvestmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Fetch investment data from Plaid.
        """
        try:
            user = request.user
            items = Item.objects.filter(user=user)
            investments = []

            for item in items:
                plaid_service = PlaidService(item)
                fetched_investments = plaid_service.fetch_investments()
                investments.extend(fetched_investments)

            return Response({'investments': investments})
        
        except Exception as e:
            logger.error(f"Error fetching investments: {str(e)}")
            return Response({'error': 'Failed to fetch investments'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        """
        Delete a Plaid Item and remove it from the database.
        """
        try:
            item = Item.objects.filter(id=item_id, user=request.user).first()
            if not item:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

            # Remove the item from Plaid
            plaid_service = PlaidService(item)
            plaid_service.remove_item()

            # Delete the item from the database
            item.delete()
            
            return Response({'status': 'Item deleted'}, status=status.HTTP_204_NO_CONTENT)
        
        except Exception as e:
            logger.error(f"Error deleting item: {str(e)}")
            return Response({'error': 'Failed to delete item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, item_id, action=None):
        """
        Refresh transactions for a specific Plaid Item.
        """
        if action != 'refresh':
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item = Item.objects.filter(id=item_id, user=request.user).first()
            if not item:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

            # Refresh accounts and transactions
            plaid_service = PlaidService(item)
            db_service = PlaidDatabaseService(item)

            accounts = plaid_service.fetch_accounts()
            db_service.create_or_update_accounts(accounts)
            added, modified, removed, cursor = plaid_service.fetch_transactions()
            db_service.create_or_update_transactions(added + modified)
            db_service.delete_transactions(removed)
            db_service.update_item_transaction_cursor(cursor)

            return Response({'status': 'success'})
        
        except Exception as e:
            logger.error(f"Error refreshing item: {str(e)}")
            return Response({'error': 'Failed to refresh item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class IncomesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            items = Item.objects.filter(user=request.user)
            if not items.exists():
                return Response({"error": "No linked Plaid accounts found."}, status=status.HTTP_400_BAD_REQUEST)

            incomes = []
            for item in items:
                if not item.access_token:
                    continue  # Skip items without an access token

                try:
                    response = plaid_client.income_get(access_token=item.access_token)
                    incomes.append(response.to_dict())
                except Exception as e:
                    logger.error(f"Error fetching income for item {item.id}: {str(e)}")

            if not incomes:
                return Response({"error": "Failed to fetch income data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({"incomes": incomes}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching incomes: {str(e)}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LiabilitiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            item = Item.objects.filter(user=user).first()
            if not item:
                return Response({"error": "No Plaid item found for this user."}, status=400)

            liabilities_request = LiabilitiesGetRequest(access_token=item.access_token)
            response = plaid_client.liabilities_get(liabilities_request)

            return Response(response.to_dict())

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class InstitutionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, institution_id=None):
        """
        Fetch all Plaid-supported financial institutions.
        """
        try:
            url = "https://sandbox.plaid.com/institutions/get"
            headers = {"Content-Type": "application/json"}
            payload = {
                "client_id": settings.PLAID_CLIENT_ID,
                "secret": settings.PLAID_SECRET,
                "country_codes": ["US"],
            }

            if institution_id:
                # Fetch specific institution details
                url = "https://sandbox.plaid.com/institutions/get_by_id"
                payload["institution_id"] = institution_id
            else:
                # Fetch multiple institutions
                payload["count"] = 10
                payload["offset"] = 0

            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return Response(response.json())

            return Response({'error': 'Unable to fetch institutions'}, status=response.status_code)
        
        except Exception as e:
            logger.error(f"Error fetching institutions: {str(e)}")
            return Response({'error': 'Failed to fetch institutions'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
