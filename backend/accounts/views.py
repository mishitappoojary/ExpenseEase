from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from backend.accounts.models import UserProfile, UserPreference, Notification

User = get_user_model()

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

class UserPreferencesView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        preferences, _ = UserPreference.objects.get_or_create(user=request.user)
        return Response({
            "email_notifications": preferences.email_notifications,
            "push_notifications": preferences.push_notifications,
            "theme": preferences.theme,
            "language": preferences.language
        }, status=status.HTTP_200_OK)

    def post(self, request):
        preferences, _ = UserPreference.objects.get_or_create(user=request.user)
        preferences.email_notifications = request.data.get("email_notifications", preferences.email_notifications)
        preferences.push_notifications = request.data.get("push_notifications", preferences.push_notifications)
        preferences.theme = request.data.get("theme", preferences.theme)
        preferences.language = request.data.get("language", preferences.language)
        preferences.save()

        return Response({"message": "Preferences updated successfully."}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "email": request.user.email,
            "username": request.user.username
        })

    def put(self, request):
        user = request.user
        username = request.data.get("username", user.username)
        email = request.data.get("email", user.email)

        if email != user.email and User.objects.filter(email=email).exists():
            return Response({"error": "Email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        user.username = username
        user.email = email
        user.save()

        return Response({"message": "Profile updated successfully."}, status=status.HTTP_200_OK)

class UserStatisticsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            "total_transactions": 100,  # TODO: Replace with actual query
            "total_spent": 5000.75,  # TODO: Replace with actual calculation
        }
        return Response(stats, status=status.HTTP_200_OK)

class LinkAccountView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        account_id = request.data.get("account_id")
        if not account_id:
            return Response({"error": "Account ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Implement account linking logic
        return Response({"message": f"Account {account_id} linked successfully."}, status=status.HTTP_200_OK)

class UnlinkAccountView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, account_id):
        # TODO: Implement account unlinking logic
        return Response({"message": f"Account {account_id} unlinked successfully."}, status=status.HTTP_200_OK)

class NotificationsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        return Response([
            {"id": n.id, "message": n.message, "read": n.read, "created_at": n.created_at}
            for n in notifications
        ], status=status.HTTP_200_OK)

class MarkNotificationReadView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.read = True
            notification.save()
            return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

class MarkAllNotificationsReadView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.notifications.update(read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
    
class UpdateProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        username = request.data.get("username", user.username)
        email = request.data.get("email", user.email)

        if email != user.email and User.objects.filter(email=email).exists():
            return Response({"error": "Email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        user.username = username
        user.email = email
        user.save()

        return Response({"message": "Profile updated successfully."}, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
