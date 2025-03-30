from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.common.models import BaseModel


class Item(BaseModel):
    """
    Item represents a login at a financial institution.
    A user can have multiple Items across different institutions.
    """

    class ItemStatusChoices(models.TextChoices):
        GOOD = "GOOD", _("Good")
        BAD = "BAD", _("Bad")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="items",
        on_delete=models.CASCADE,
    )
    access_token = models.CharField(
        unique=True,
        max_length=255,
        help_text=_("Access token associated with the Item."),
    )
    item_id = models.CharField(
        unique=True,
        max_length=255,
        help_text=_("Plaid's Item ID."),
    )
    institution_id = models.CharField(
        max_length=255,
        help_text=_("Plaid Institution ID."),
    )
    institution_name = models.CharField(
        max_length=255,
        help_text=_("Financial institution name."),
    )
    status = models.CharField(
        max_length=4,
        choices=ItemStatusChoices.choices,
        help_text=_("Item status (Good/Bad)."),
    )
    new_accounts_detected = models.BooleanField(
        default=False,
        help_text=_("True when Plaid detects a new account."),
    )
    transactions_cursor = models.TextField(
        blank=True,
        help_text=_("Cursor for tracking new transactions."),
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.institution_name} - {self.user}"


class PlaidLinkEvent(BaseModel):
    """
    Logs events from the Plaid API for client requests to Plaid Link.
    """

    class EventTypeChoices(models.TextChoices):
        SUCCESS = "SUCCESS", _("Success")
        EXIT = "EXIT", _("Exit")

    user_id = models.CharField(
        max_length=250,
        db_index=True,
        help_text=_("User ID."),
    )
    event_type = models.CharField(
        max_length=20,
        choices=EventTypeChoices.choices,
        help_text=_("Event type (Success/Exit)."),
    )
    link_session_id = models.TextField(help_text=_("Unique session identifier for Link."))
    request_id = models.TextField(blank=True, help_text=_("Request ID for troubleshooting."))
    error_type = models.TextField(blank=True, help_text=_("Error type if applicable."))
    error_code = models.TextField(blank=True, help_text=_("Error code if applicable."))

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"LinkEvent: {self.user_id} - {self.event_type}"


class Account(BaseModel):
    """
    Stores financial accounts linked to an Item.
    """

    class AccountTypeChoices(models.TextChoices):
        INVESTMENT = "investment", _("Investment")
        CREDIT = "credit", _("Credit")
        DEPOSITORY = "depository", _("Depository")
        LOAN = "loan", _("Loan")
        BROKERAGE = "brokerage", _("Brokerage")
        OTHER = "other", _("Other")

    item = models.ForeignKey(
        Item,
        related_name="accounts",
        on_delete=models.CASCADE,
    )
    account_id = models.CharField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text=_("Plaid’s unique identifier for the account."),
    )
    name = models.CharField(max_length=250, help_text=_("Account name."))
    mask = models.CharField(max_length=4, blank=True, help_text=_("Last 4 digits of the account number."))
    official_name = models.CharField(max_length=255, blank=True, help_text=_("Official account name."))
    available_balance = models.DecimalField(
        max_digits=20, decimal_places=2,
        blank=True, null=True,
        help_text=_("Available balance."),
    )
    current_balance = models.DecimalField(
        max_digits=20, decimal_places=2,
        blank=True, null=True,
        help_text=_("Current balance."),
    )
    limit = models.DecimalField(
        max_digits=20, decimal_places=2,
        blank=True, null=True,
        help_text=_("Credit limit (for credit accounts)."),
    )
    iso_currency_code = models.CharField(max_length=10, blank=True, help_text=_("ISO currency code."))
    account_type = models.CharField(
        max_length=20,
        choices=AccountTypeChoices.choices,
        help_text=_("Account type."),
    )
    account_subtype = models.CharField(max_length=250, blank=True, help_text=_("Account subtype."))

    def __str__(self):
        return f"Account {self.account_id} ({self.name})"


class Transaction(BaseModel):
    """
    Stores transactions linked to an account.
    """

    class TransactionCategoryConfidenceLevel(models.TextChoices):
        UNKNOWN = "unknown", _("Unknown")
        LOW = "low", _("Low")
        MEDIUM = "medium", _("Medium")
        HIGH = "high", _("High")
        VERY_HIGH = "very_high", _("Very High")

    account = models.ForeignKey(
        Account,
        related_name="transactions",
        on_delete=models.CASCADE,
    )
    transaction_id = models.CharField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text=_("Unique transaction ID."),
    )
    amount = models.DecimalField(
        max_digits=20, decimal_places=2,
        blank=True, null=True,
        help_text=_("Transaction amount."),
    )
    iso_currency_code = models.CharField(max_length=10, blank=True, help_text=_("ISO currency code."))
    location = models.JSONField(help_text=_("Transaction location details."))
    name = models.CharField(max_length=255, blank=True, help_text=_("Transaction name."))
    merchant_name = models.CharField(max_length=255, blank=True, help_text=_("Enriched merchant name."))
    pending = models.BooleanField(help_text=_("True if transaction is pending."))
    account_owner = models.CharField(max_length=255, blank=True, help_text=_("Account owner name."))
    date = models.DateField(help_text=_("Transaction date."))
    authorized_date = models.DateField(blank=True, null=True, help_text=_("Authorization date."))
    datetime = models.DateTimeField(blank=True, null=True, help_text=_("Transaction timestamp."))
    authorized_datetime = models.DateTimeField(blank=True, null=True, help_text=_("Authorization timestamp."))
    confidence_level = models.CharField(
        max_length=20,
        choices=TransactionCategoryConfidenceLevel.choices,
        blank=True,
        help_text=_("Confidence level in transaction categorization."),
    )

    class Meta:
        ordering = ("-date",)

    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.account}"
