from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from datetime import timedelta, timezone
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    
class Goal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=50)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    progress = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.title} - {self.budget} - Progress: {self.progress}"
        
class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, default="unknown")
    date = models.DateTimeField()
    category = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=10, choices=[('debit', 'Debit'), ('credit', 'Credit')], default='debit')
    ref_number = models.CharField(max_length=100, null=True, blank=True)  # Optional, for SMS transactions
    bank = models.CharField(max_length=50, null=True, blank=True)  # Optional, for SMS transactions
    source = models.CharField(max_length=50, choices=[('sms', 'SMS'), ('ocr', 'OCR'), ('manual', 'Manual')], default='manual')
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.description} - {self.category} - {self.type} - {self.ref_number} - {self.bank} - {self.source}"


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

# Budgeting feature

class DynamicBudget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    period = models.CharField(max_length=10, choices=(('weekly', 'Weekly'), ('monthly', 'Monthly')))
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'period', 'category')

    def __str__(self):
        return f"{self.user.username} - {self.period} budget for {self.category}"

class BudgetCategory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Budget(models.Model):
    PERIOD_CHOICES = [
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(BudgetCategory, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default="monthly")
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def spent_amount(self):
        today = timezone.localdate()  # Local date with timezone awareness
        if self.period == "weekly":
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)

            total_spent = Transaction.objects.filter(
                user=self.user,
                category=self.category.name,
                date__range=(week_start, week_end)
            ).aggregate(total_spent=Sum('amount'))['total_spent'] or 0
        else:
            total_spent = Transaction.objects.filter(
                user=self.user,
                category=self.category.name,
                date__range=(self.start_date, self.end_date)
            ).aggregate(total_spent=Sum('amount'))['total_spent'] or 0

        return total_spent
    
    def adjust_budget(self):
        spent = self.spent_amount()

        if spent > self.amount:
            # Example dynamic increase: 10% increase if overspent by more than 20%
            if spent > self.amount * 1.2:
                self.amount = self.amount * 1.20
            else:
                self.amount = self.amount * 1.10

            self.save()
    
    def is_nearing_limit(self):
        spent = self.spent_amount()
        return spent >= self.amount * 0.8
    
    def remaining_amount(self):
        return self.amount - self.spent_amount()

    def previous_week_spent_amount(self):
        today = timezone.localdate()
        last_week_start = today - timedelta(days=today.weekday() + 7)  # Start of the previous week
        last_week_end = last_week_start + timedelta(days=6)  # End of the previous week

        total_spent_last_week = Transaction.objects.filter(
            user=self.user,
            category=self.category.name,
            date__range=(last_week_start, last_week_end)
        ).aggregate(total_spent=Sum('amount'))['total_spent'] or 0

        return total_spent_last_week
    
    def __str__(self):
        return f"{self.category.name} Budget - {self.period}"

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_budget(sender, instance, created, **kwargs):
    if created:
        default_category, created = BudgetCategory.objects.get_or_create(user=instance, name="General")
        Budget.objects.create(user=instance, category=default_category, amount=500, period="monthly")
