from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserPreferences, UserStatistics, LinkedAccount, Notification, FinancialAccount, Transaction, Goal, Budget, BudgetCategory, DynamicBudget

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

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'title', 'icon', 'budget', 'progress']

# Budgeting feature

class DynamicBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicBudget
        fields = '__all__'

class BudgetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetCategory
        fields = ['id', 'name']

class BudgetSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field='name',
        queryset=BudgetCategory.objects.all()
    )

    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ['id', 'category', 'amount', 'period', 'start_date', 'end_date', 'spent', 'remaining']

    def get_spent(self, obj):
        return obj.spent_amount()

    def get_remaining(self, obj):
        return obj.remaining_amount()

    def create(self, validated_data):
        user = self.context['request'].user
        category_name = validated_data.pop('category')
        category, created = BudgetCategory.objects.get_or_create(user=user, name=category_name)

        # Calculate the recommended budget if it's a weekly period
        if validated_data['period'] == 'weekly':
            weekly_spent = category.weekly_spent_amount()
            recommended_budget = weekly_spent * 1.2  # Budget 20% more than the average weekly spending

            validated_data['amount'] = recommended_budget

        # Create the budget instance
        budget = Budget.objects.create(user=user, category=category, **validated_data)
        return budget

class BudgetSummarySerializer(serializers.Serializer):
    category = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=10, decimal_places=2)
    period = serializers.CharField()
    is_nearing_limit = serializers.BooleanField()

class SuggestedBudgetSerializer(serializers.Serializer):
    category = serializers.CharField()
    suggested_amount = serializers.FloatField()
