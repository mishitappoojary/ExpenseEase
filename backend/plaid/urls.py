# backend/plaid/urls.py
from django.urls import path
from backend.plaid import views
from backend.plaid import transactions_views

urlpatterns = [
    # Original endpoints
    path("", views.dashboard, name="dashboard"),
    path("create-link-token/", views.create_link_token, name="create_link_token"),
    path("exchange-public-token/", views.exchange_public_token, name="exchange_public_token"),
    path("webhook/", views.plaid_webhook, name="plaid_webhook"),
    path("reset-login/", views.reset_sandbox_item_login, name="reset_login"),
    path("fire-webhook/", views.fire_sandbox_webhook, name="fire_webhook"),
    
    # New endpoints for React Native compatibility
    path("transactions/", transactions_views.TransactionsView.as_view(), name="transactions"),
    path("accounts/", transactions_views.AccountsView.as_view(), name="accounts"),
    path("investments/", transactions_views.InvestmentsView.as_view(), name="investments"),
    path("items/<int:item_id>/", transactions_views.ItemsView.as_view(), name="items"),
    path("items/<int:item_id>/<str:action>/", transactions_views.ItemsView.as_view(), name="item_actions"),
    path("institutions/<str:institution_id>/", transactions_views.InstitutionsView.as_view(), name="institutions"),
]
