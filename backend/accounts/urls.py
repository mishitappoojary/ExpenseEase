from django.urls import path
from .views import (
    LogoutView, UserProfileView, UpdateProfileView,
    ChangePasswordView, UserPreferencesView, UserStatisticsView,
    LinkAccountView, UnlinkAccountView, NotificationsView, 
    MarkNotificationReadView, MarkAllNotificationsReadView
)
from .auth_views import SignUpView, LoginView

urlpatterns = [
    # Authentication
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # User Profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # User Preferences
    path('preferences/', UserPreferencesView.as_view(), name='user_preferences'),

    # User Statistics
    path('stats/', UserStatisticsView.as_view(), name='user_statistics'),

    # Account Linking
    path('link-account/', LinkAccountView.as_view(), name='link_account'),
    path('unlink-account/<int:account_id>/', UnlinkAccountView.as_view(), name='unlink_account'),

    # Notifications
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('notifications/mark-read/<int:notification_id>/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
]
