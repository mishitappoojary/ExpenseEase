from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),

    # Include app-level routes
    path('api/plaid/', include('backend.plaid.urls')),  # ✅ Plaid Endpoints
    path('api/accounts/', include('backend.accounts.urls')),  # ✅ Accounts Endpoints
    path('api/auth/', include('backend.finance_app.urls')),  # ✅ Auth & User Management

    path("api/", include("finance_app.urls")),

]
