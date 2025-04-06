# finance_app/admin.py

from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class ManualTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'description', 'date')
    search_fields = ('user__email', 'description')
    list_filter = ('date',)
    ordering = ('-date',)
