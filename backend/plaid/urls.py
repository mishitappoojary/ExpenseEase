from django.urls import path
from backend.plaid import views, transactions_views
# from .views import custom_token_verify
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CustomTokenObtainPairView, CustomTokenRefreshView
from .transactions_views import (
    TransactionsView,
    AccountsView,
    InvestmentsView,
    ItemsView,
    InstitutionsView,
    IncomesView,
    LiabilitiesView
)

urlpatterns = [
    # ✅ Dashboard & Core Plaid Endpoints
    path("", views.dashboard, name="dashboard"),
    path("create-link-token/", views.create_link_token, name="create_link_token"),
    path("exchange-public-token/", views.exchange_public_token, name="exchange_public_token"),
    path("webhook/", views.plaid_webhook, name="plaid_webhook"),
    
    # ✅ Sandbox Testing Endpoints
    path("reset-login/", views.reset_sandbox_item_login, name="reset_login"),
    path("fire-webhook/", views.fire_sandbox_webhook, name="fire_webhook"),

    # path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    # path('api/token/verify/', custom_token_verify, name='token_verify'),

    # ✅ Financial Data Endpoints
    path("transactions/", TransactionsView.as_view(), name="transactions"),
    path("accounts/", AccountsView.as_view(), name="accounts"),
    path("investments/", InvestmentsView.as_view(), name="investments"),
    path("incomes/", IncomesView.as_view(), name="incomes"),
    path("liabilities/", LiabilitiesView.as_view(), name="liabilities"),

    # ✅ Items & Institutions Endpoints
    path("items/<int:item_id>/", ItemsView.as_view(), name="items"),
    path("items/<int:item_id>/refresh/", ItemsView.as_view(), name="item_refresh"),
    path("institutions/", InstitutionsView.as_view(), name="institutions-list"),
    path("institutions/<str:institution_id>/", InstitutionsView.as_view(), name="institution-detail"),
]