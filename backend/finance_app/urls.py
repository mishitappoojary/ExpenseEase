from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from . import views  # Make sure views.py exists and has homepage & api_root
from backend.finance_app.views import CustomTokenObtainPairView, CustomTokenRefreshView
from backend.plaid.transactions_views import LiabilitiesView

from .views import protected_endpoint

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

    path("protected-endpoint/", protected_endpoint, name="protected-endpoint"),

    # Authentication
    path('api/auth/', include('rest_framework.urls')),  # DRF built-in authentication views
]

# Serve media files in development mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
