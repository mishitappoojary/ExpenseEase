from django.conf import settings  # Import settings properly
import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
import os

# Ensure Django settings are loaded (if not already loaded)
if not settings.configured:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "finance_app.settings.base")  # Replace finance_app with your project name if needed
    import django
    django.setup()  # Load the Django settings

class PlaidConfig:
    """
    Environment configuration and initialization for the Plaid API client.
    """

    def __init__(self):
        self.language = "en"
        self.version = "2020-09-14"
        self.client_name = settings.APP_NAME  # Access settings using django.conf.settings
        self.client_id = settings.PLAID_CLIENT_ID
        self.secret = settings.PLAID_SECRET
        self.products = self._get_products()
        self.country_codes = self._get_country_codes()
        self.environment = self._get_plaid_environment()
        self.redirect_uri = self._get_redirect_uri()
        self.webhook_uri = self._get_webhook_uri()
        self.client = self._initialize_client()

    def _get_plaid_environment(self) -> plaid.Environment:
        """
        Returns the appropriate Plaid environment based on the Django settings.
        """
        if settings.PLAID_ENV == "production":
            return plaid.Environment.Production
        if settings.PLAID_ENV == "sandbox":
            return plaid.Environment.Sandbox
        return plaid.Environment.Sandbox

    def _initialize_client(self) -> plaid_api.PlaidApi:
        """
        Initializes and returns the Plaid API client with the configured environment.
        """
        configuration = plaid.Configuration(
            host=self.environment,
            api_key={
                "clientId": self.client_id,
                "secret": self.secret,
                "plaidVersion": self.version,
            },
        )
        api_client = plaid.ApiClient(configuration)
        return plaid_api.PlaidApi(api_client)

    def _get_products(self) -> list[Products]:
        """
        Returns a list of Products objects.
        """
        return [Products(product) for product in settings.PLAID_PRODUCTS]


    def _get_country_codes(self) -> list[CountryCode]:
        """
        Returns a list of CountryCode objects.
        """
        return [CountryCode(code) for code in settings.PLAID_COUNTRY_CODES]


    def _get_redirect_uri(self) -> str:
        """
        Returns the redirect URI.
        """
        return f"{settings.APP_URL}/finance"  # Settings accessed correctly here

    def _get_webhook_uri(self) -> str:
        """
        Returns the webhook URI.
        """
        return f"{settings.APP_URL}/finance/webhook"


plaid_config = PlaidConfig()