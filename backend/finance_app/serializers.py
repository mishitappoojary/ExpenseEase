from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserPreferences, UserStatistics, LinkedAccount, Notification, FinancialAccount, Transaction

User = get_user_model()

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone_number", "is_verified"]

# Registration Serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        """Create a new user with a hashed password."""
        user = User.objects.create_user(**validated_data)
        return user

# User Preferences Serializer
class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = "__all__"
        read_only_fields = ["user"]  # If user is assigned automatically

# User Statistics Serializer
class UserStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStatistics
        fields = "__all__"
        read_only_fields = ["user", "created_at"]  # If timestamps exist

# Linked Account Serializer
class LinkedAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedAccount
        fields = "__all__"

# Financial Account Serializer
class FinancialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialAccount
        fields = "__all__"

# Notification Serializer
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'amount', 'description', 'date', 'category', 'type', 'ref_number', 'bank', 'source']
        read_only_fields = ['id', 'user']