from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        Group,
        related_name="finance_app_users",  # ✅ Set a unique related_name
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="finance_app_user_permissions",  # ✅ Set a unique related_name
        blank=True
    )

    def __str__(self):
        return self.username

    class Meta:
        app_label = "finance_app"
    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username

# User Preferences Model
class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    dark_mode = models.BooleanField(default=False)
    currency = models.CharField(max_length=10, default="USD")
    notifications_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} Preferences"

# User Statistics Model
class UserStatistics(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="statistics")
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_income = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username} Statistics"

# Linked Account Model
class LinkedAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="linked_accounts")
    provider = models.CharField(max_length=100)
    account_id = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.user.username} - {self.provider}"
    
class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, default="Scanned Bill")
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.amount}"

# Financial Account Model (NEW)
class FinancialAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="financial_accounts")
    account_name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=[("Checking", "Checking"), ("Savings", "Savings"), ("Investment", "Investment")])
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    institution_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.account_name} - {self.user.username}"

# Notification Model
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"
