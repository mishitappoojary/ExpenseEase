# backend/plaid/transactions_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
import logging
from .models import Item, Transaction, Account
from .services import PlaidService, PlaidDatabaseService
from .utils import plaid_config


logger = logging.getLogger(__name__)
plaid_client = plaid_config.client

class TransactionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all transactions for the authenticated user.
        """
        try:
            user = request.user
            
            # Get all transactions for the user
            transactions = Transaction.objects.filter(
                account__item__user=user
            ).order_by('-date')[:100]  # Limit to 100 most recent transactions
            
            # Format the response
            transaction_data = []
            for transaction in transactions:
                transaction_data.append({
                    'id': transaction.transaction_id,
                    'account_id': transaction.account.account_id,
                    'amount': transaction.amount,
                    'date': transaction.date,
                    'name': transaction.name,
                    'category': [transaction.primary_personal_finance_category] if transaction.primary_personal_finance_category else [],
                    'pending': transaction.pending,
                    'merchant_name': transaction.merchant_name,
                    'logo_url': transaction.logo_url,
                })
            
            return Response({'transactions': transaction_data})
        
        except Exception as e:
            logger.error(f"Error fetching transactions: {str(e)}")
            return Response(
                {'error': 'Failed to fetch transactions'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AccountsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all accounts for the authenticated user.
        """
        try:
            user = request.user
            
            # Get all accounts for the user
            accounts = Account.objects.filter(item__user=user)
            
            # Format the response
            account_data = []
            for account in accounts:
                account_data.append({
                    'id': account.account_id,
                    'name': account.name,
                    'type': account.account_type,
                    'subtype': account.account_subtype,
                    'balance': {
                        'available': account.available_balance,
                        'current': account.current_balance,
                        'limit': account.limit,
                    },
                    'mask': account.mask,
                    'institution_name': account.item.institution_name,
                })
            
            return Response({'accounts': account_data})
        
        except Exception as e:
            logger.error(f"Error fetching accounts: {str(e)}")
            return Response(
                {'error': 'Failed to fetch accounts'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InvestmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Placeholder for investments endpoint.
        """
        # This is a placeholder since your current implementation doesn't have investments
        return Response({'investments': []})

class ItemsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, item_id):
        """
        Delete a Plaid Item.
        """
        try:
            # Find the item
            item = Item.objects.filter(id=item_id, user=request.user).first()
            
            if not item:
                return Response(
                    {'error': 'Item not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Delete the item
            item.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        except Exception as e:
            logger.error(f"Error deleting item: {str(e)}")
            return Response(
                {'error': 'Failed to delete item'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, item_id, action=None):
        """
        Perform actions on a Plaid Item.
        """
        if action != 'refresh':
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find the item
            item = Item.objects.filter(id=item_id, user=request.user).first()
            
            if not item:
                return Response(
                    {'error': 'Item not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Refresh the item's accounts and transactions
            plaid_service = PlaidService(item)
            db_service = PlaidDatabaseService(item)
            
            # Fetch accounts
            accounts = plaid_service.fetch_accounts()
            db_service.create_or_update_accounts(accounts)
            
            # Fetch transactions
            added, modified, removed, cursor = plaid_service.fetch_transactions()
            db_service.create_or_update_transactions(added + modified)
            db_service.delete_transactions(removed)
            db_service.update_item_transaction_cursor(cursor)
            
            return Response({'status': 'success'})
        
        except Exception as e:
            logger.error(f"Error refreshing item: {str(e)}")
            return Response(
                {'error': 'Failed to refresh item'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InstitutionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, institution_id):
        """
        Placeholder for institution details endpoint.
        """
        # This is a placeholder since your current implementation doesn't have institution details
        return Response({
            'institution': {
                'id': institution_id,
                'name': 'Unknown Institution',
                'logo': None,
            }
        })
