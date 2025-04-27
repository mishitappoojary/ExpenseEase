# backend/finance_app/cron.py
from django_cron import CronJobBase, Schedule
from backend.finance_app.models import Budget, User

class AutoCreateBudgetsCron(CronJobBase):
    schedule = Schedule(run_at_times=['00:00'])  # Runs every Sunday at midnight
    code = 'finance_app.auto_create_budgets'

    def do(self):
        # Logic to create default budgets for all users
        users = User.objects.all()
        for user in users:
            if not Budget.objects.filter(user=user).exists():
                Budget.objects.create(user=user, category="General", amount=500, period="monthly")
                print(f'Created budget for {user.username}')
