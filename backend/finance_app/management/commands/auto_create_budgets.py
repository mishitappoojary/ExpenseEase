# backend/finance_app/management/commands/auto_create_budgets.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from backend.finance_app.models import User, BudgetCategory, Budget

class Command(BaseCommand):
    help = 'Automatically create budgets for users based on their past spending'

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        for user in User.objects.all():
            categories = BudgetCategory.objects.filter(user=user)

            for category in categories:
                # Check if a budget already exists for this period
                existing_budget = Budget.objects.filter(
                    user=user,
                    category=category,
                    start_date__lte=today,
                    end_date__gte=today
                ).first()

                if existing_budget:
                    self.stdout.write(self.style.WARNING(f"Budget already exists for {user.email} - {category.name}"))
                    continue

                # Calculate previous week's spending for weekly budgets
                last_week_start = today - timedelta(days=today.weekday() + 7)
                last_week_end = last_week_start + timedelta(days=6)

                weekly_spent = category.transaction_set.filter(
                    date__range=(last_week_start, last_week_end)
                ).aggregate(total_spent=Sum('amount'))['total_spent'] or 0

                if weekly_spent == 0:
                    weekly_spent = 100  # fallback minimum budget

                recommended_weekly_budget = weekly_spent * 1.2

                # Create a new budget
                budget = Budget.objects.create(
                    user=user,
                    category=category,
                    amount=recommended_weekly_budget,
                    period='weekly',
                    start_date=today,
                    end_date=today + timedelta(days=6)
                )

                self.stdout.write(self.style.SUCCESS(f"Created new budget for {user.email} - {category.name}"))
