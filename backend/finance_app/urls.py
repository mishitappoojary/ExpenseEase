from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from . import views 
from backend.finance_app.views import CustomTokenObtainPairView, CustomTokenRefreshView
from backend.plaid.transactions_views import LiabilitiesView
from .views import TransactionListCreateView
from .views import TransactionRetrieveUpdateDestroyView
from .views import DeleteAllTransactionsView
from .views import GoalViewSet
from .views import investment_recommendations
from .views import generate_dynamic_budget, get_dynamic_budgets

from .views import protected_endpoint
from rest_framework.routers import DefaultRouter
from .views import BudgetViewSet, BudgetCategoryViewSet, BudgetSummaryViewSet, BudgetSuggestionsView

router = DefaultRouter()
# router.register(r'budgets', BudgetViewSet, basename='budget')
# router.register(r'budget-categories', BudgetCategoryViewSet, basename='budget-category')

urlpatterns = [
    # Root endpoints
    path('', views.homepage, name="homepage"),  # Ensure homepage exists in views.py
    path('api/', views.api_root, name='api_root'),  # Ensure api_root exists in views.py

    # Admin Panel
    path('admin/', admin.site.urls),

    # App Endpoints
    path('api/plaid/', include('backend.plaid.urls')),  # Plaid API endpoints
    path('api/accounts/', include('backend.accounts.urls')),  # Account-related endpoints

    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path("liabilities/", LiabilitiesView.as_view(), name="liabilities"),
    path('api/transactions/delete/', DeleteAllTransactionsView.as_view(), name='delete-all-transactions'),
    path('api/transactions/', TransactionListCreateView.as_view(), name='transactions-list-create'),
    path('api/transactions/<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='transaction-detail'),
    path("protected-endpoint/", protected_endpoint, name="protected-endpoint"),
    path("api/transactions/unknown/", views.get_unknown_transactions, name="get_unknown_transactions"),
    path("api/transactions/bulk_update_category/", views.bulk_update_category, name="bulk_update_category"),
    path('api/goals/', views.GoalViewSet.as_view({'get': 'list', 'post': 'create'}), name='goal-list-create'),
    path('api/goals/<int:pk>/', views.GoalViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='goal-detail-update-delete'),
    path('api/goals/<int:pk>/update-progress/', views.GoalViewSet.as_view({'post': 'update_progress'}), name='goal-update-progress'),
    path('api/investment-recommendations/', investment_recommendations, name='investment-recommendations'),
    path('api/chatbot/', views.chatbot_query, name='chatbot_query'),
    path('budget/suggestions/', BudgetSuggestionsView.as_view(), name='budget-suggestions'),

    path('api/', include(router.urls)),
    path('api/budgets/auto-generate/', generate_dynamic_budget, name="generate_dynamic_budget"),
    path('api/budgets/auto/', get_dynamic_budgets, name="get_dynamic_budgets"),
    #path('api/bills/upcoming/', upcoming_bills, name='upcoming_bills'),

    # Authentication
    path('api/auth/', include('rest_framework.urls')),  # DRF built-in authentication views

    path('api/process-receipt/', views.process_receipt, name='process_receipt'),
    path('api/get-merchant-category/', views.get_merchant_category, name='get_merchant_category'),
]

# Serve media files in development mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
