import json
import logging

import plaid
from backend.plaid.models import Account, Item, Transaction
from backend.plaid.utils import plaid_config
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.accounts_get_request_options import AccountsGetRequestOptions
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.transactions_sync_request_options import TransactionsSyncRequestOptions

logger = logging.getLogger(__name__)


class PlaidService:
    """
    Plaid API service class.
    """
    def __init__(self, item: Item):
        self.item = item
        self.access_token = item.access_token
        self.cursor = item.transactions_cursor if item.transactions_cursor is not None else ""

    def fetch_transactions(self, retries_left=3) -> tuple[list, list, list, str]:
        """
        Get incremental transaction updates on an Item.
        """
        added, modified, removed = [], [], []
        has_more = True

        if retries_left <= 0:
            logger.info(f"Too many retries for item {self.item.item_id}")
            return added, modified, removed, self.cursor

        try:
            while has_more:
                request = TransactionsSyncRequest(
                    access_token=self.access_token,
                    cursor=self.cursor,
                    options=TransactionsSyncRequestOptions(include_personal_finance_category=True)
                )
                response = plaid_config.client.transactions_sync(request).to_dict()

                added.extend(response.get("added", []))
                modified.extend(response.get("modified", []))
                removed.extend(response.get("removed", []))
                has_more = response.get("has_more", False)
                self.cursor = response.get("next_cursor", self.cursor)

            return added, modified, removed, self.cursor

        except plaid.ApiException as e:
            err = json.loads(e.body)
            logger.error(f"Plaid API error fetching transactions: {err}")

            if err.get("error_code") in [
                "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION",
                "ITEM_LOGIN_REQUIRED",
                "ITEM_LOCKED",
            ]:
                return self.fetch_transactions(retries_left - 1)

            return added, modified, removed, self.cursor

        except Exception as e:
            logger.error(f"Unexpected error fetching transactions: {str(e)}")
            return added, modified, removed, self.cursor

    def fetch_accounts(self) -> list:
        """
        Retrieve a list of accounts associated with the linked Item.
        """
        try:
            request = AccountsGetRequest(
                access_token=self.access_token,
                options=AccountsGetRequestOptions(include_auth=True)
            )
            response = plaid_config.client.accounts_get(request)
            return response.to_dict().get("accounts", [])

        except plaid.ApiException as e:
            err = json.loads(e.body)
            logger.error(f"Plaid API error fetching accounts: {err}")

            if err.get("error_code") in ["ITEM_LOGIN_REQUIRED", "ITEM_LOCKED"]:
                self.update_item_to_bad_state()

            return []

        except Exception as e:
            logger.error(f"Unexpected error fetching accounts: {str(e)}")
            return []


class PlaidDatabaseService:
    """
    Plaid database service class.
    """
    def __init__(self, item: Item):
        self.item = item

    def create_or_update_transactions(self, transactions) -> None:
        """
        Creates or updates multiple transactions.
        """
        for transaction in transactions:
            defaults = {
                "pending": transaction["pending"],
                "date": transaction["date"],
                "location": transaction.get("location", {}) or {},
            }

            category = transaction.get("personal_finance_category")
            if category:
                defaults.update({
                    "primary_personal_finance_category": category.get("primary"),
                    "detailed_personal_finance_category": category.get("detailed"),
                    "confidence_level": category.get("confidence_level"),
                })

            optional_fields = [
                "amount", "iso_currency_code", "unofficial_currency_code", "check_number",
                "name", "merchant_name", "merchant_entity_id", "account_owner",
                "logo_url", "website", "authorized_date", "datetime",
                "authorized_datetime", "personal_finance_category_icon_url",
            ]
            for key in optional_fields:
                if key in transaction:
                    defaults[key] = transaction[key]

            account = Account.objects.filter(account_id=transaction["account_id"]).first()
            if not account:
                logger.warning(f"Account {transaction['account_id']} not found for transaction {transaction['transaction_id']}")
                continue

            Transaction.objects.update_or_create(
                account=account,
                transaction_id=transaction["transaction_id"],
                defaults=defaults,
            )

        logger.info(f"{len(transactions)} transactions saved.")

    def delete_transactions(self, transactions) -> None:
        """
        Removes one or more transactions.
        """
        transaction_ids = [t["transaction_id"] for t in transactions]
        
        if not transaction_ids:
            logger.info("No transactions to delete.")
            return

        deleted_count, _ = Transaction.objects.filter(transaction_id__in=transaction_ids).delete()
        logger.info(f"{deleted_count} transactions deleted from database.")
