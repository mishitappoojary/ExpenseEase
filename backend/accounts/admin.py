from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import User
from .models import UserProfile, UserPreference, Notification


# Define inline admin classes
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'User Profile'

class UserPreferenceInline(admin.StackedInline):
    model = UserPreference
    can_delete = False
    verbose_name_plural = 'User Preferences'

# Define custom User admin with inlines
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline, UserPreferenceInline)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'description', 'date')
    search_fields = ('user__email', 'description')
    list_filter = ('date',)

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(UserProfile)
admin.site.register(UserPreference)
admin.site.register(Notification)