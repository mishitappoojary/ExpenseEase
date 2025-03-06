from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = [
    path('', views.homepage, name ="homepage"),
    path('api/', views.api_root, name='api_root'),

    path('admin/', admin.site.urls),
    path('api/plaid/', include('backend.plaid.urls')),  # Plaid API endpoints
    path('api/accounts/', include('backend.accounts.urls')),  # Account related endpoints
    path('api/auth/', include('rest_framework.urls')),  # DRF auth views
]

