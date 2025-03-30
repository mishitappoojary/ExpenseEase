# backend/finance_app/views.py
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


from django.contrib.auth.models import update_last_login
from .models import UserProfile
from .serializers import UserSerializer, RegisterSerializer
from rest_framework_simplejwt.exceptions import TokenError

def homepage(request):
    """
    Simple homepage view that returns JSON or HTML depending on the request.
    """
    if request.headers.get('Accept') == 'application/json':
        return JsonResponse({
            'status': 'success',
            'message': 'Welcome to ExpenseEase API',
            'endpoints': {
                'admin': '/admin/',
                'plaid_api': '/api/plaid/',
                'accounts_api': '/api/accounts/',
                'auth_api': '/api/auth/'
            }
        })
    return render(request, 'homepage.html')

@api_view(['GET'])
def api_root(request):
    """
    API root endpoint that provides links to all available endpoints.
    """
    return Response({
        'status': 'success',
        'message': 'Welcome to ExpenseEase API',
        'endpoints': {
            'admin': '/admin/',
            'plaid_api': '/api/plaid/',
            'accounts_api': '/api/accounts/',
            'auth_api': '/api/auth/'
        }
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protected_endpoint(request):
    return Response({"message": "Access granted! You are authenticated."}, status=200)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user  # Correct way to get user
        update_last_login(None, user)  # Update last login timestamp
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Login View.
    """
    permission_classes = [AllowAny]  # Ensure unauthenticated users can log in
    serializer_class = CustomTokenObtainPairSerializer  # Use the custom serializer

class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom JWT Refresh Token View.
    """
    permission_classes = [AllowAny]

# ✅ Signup View (Using RegisterSerializer)
class SignUpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)  # ✅ Use RegisterSerializer
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ User Profile View
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

# ✅ Logout View (Fixed Exception Handling)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
