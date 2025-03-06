# backend/accounts/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, UserPreference, Notification
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Validate input
        if not username or not email or not password:
            return Response({'error': 'Please provide username, email and password'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': e.messages}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        # Create default preferences
        UserPreference.objects.create(user=user)
        
        return Response({'message': 'User registered successfully'}, 
                        status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    try:
        user = request.user
        profile = UserProfile.objects.get(user=user)
        
        response_data = {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
            'profile': {
                'phone_number': profile.phone_number,
                'address': profile.address,
                'city': profile.city,
                'state': profile.state,
                'zip_code': profile.zip_code,
                'country': profile.country,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
            }
        }
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error fetching user profile: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user
        profile = UserProfile.objects.get(user=user)
        
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        
        user.save()
        
        # Update profile fields
        if 'phone_number' in request.data:
            profile.phone_number = request.data['phone_number']
        if 'address' in request.data:
            profile.address = request.data['address']
        if 'city' in request.data:
            profile.city = request.data['city']
        if 'state' in request.data:
            profile.state = request.data['state']
        if 'zip_code' in request.data:
            profile.zip_code = request.data['zip_code']
        if 'country' in request.data:
            profile.country = request.data['country']
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
        
        profile.save()
        
        return Response({'message': 'Profile updated successfully'})
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Check if old password is correct
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response({'error': e.messages}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password changed successfully'})
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_preferences(request):
    try:
        user = request.user
        preferences, created = UserPreference.objects.get_or_create(user=user)
        
        response_data = {
            'currency': preferences.currency,
            'theme': preferences.theme,
            'language': preferences.language,
            'notifications_enabled': preferences.notifications_enabled,
            'email_notifications': preferences.email_notifications,
            'push_notifications': preferences.push_notifications,
        }
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error fetching user preferences: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    try:
        user = request.user
        preferences, created = UserPreference.objects.get_or_create(user=user)
        
        if 'currency' in request.data:
            preferences.currency = request.data['currency']
        if 'theme' in request.data:
            preferences.theme = request.data['theme']
        if 'language' in request.data:
            preferences.language = request.data['language']
        if 'notifications_enabled' in request.data:
            preferences.notifications_enabled = request.data['notifications_enabled']
        if 'email_notifications' in request.data:
            preferences.email_notifications = request.data['email_notifications']
        if 'push_notifications' in request.data:
            preferences.push_notifications = request.data['push_notifications']
        
        preferences.save()
        
        return Response({'message': 'Preferences updated successfully'})
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    # Implement user statistics logic
    return Response({'message': 'User statistics endpoint not yet implemented'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_account(request):
    # Implement account linking logic
    return Response({'message': 'Account linking endpoint not yet implemented'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlink_account(request, account_id):
    # Implement account unlinking logic
    return Response({'message': 'Account unlinking endpoint not yet implemented'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    try:
        user = request.user
        notifications = Notification.objects.filter(user=user).order_by('-created_at')
        
        response_data = []
        for notification in notifications:
            response_data.append({
                'id': notification.id,
                'message': notification.message,
                'type': notification.notification_type,
                'read': notification.read,
                'created_at': notification.created_at,
            })
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        user = request.user
        notification = Notification.objects.get(id=notification_id, user=user)
        notification.read = True
        notification.save()
        
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, 
                        status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    try:
        user = request.user
        Notification.objects.filter(user=user, read=False).update(read=True)
        
        return Response({'message': 'All notifications marked as read'})
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return Response({'error': str(e)}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
