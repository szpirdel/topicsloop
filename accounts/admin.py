from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Opcjonalnie możesz skonfigurować, jakie pola są widoczne
    model = CustomUser
    list_display = ['email', 'username', 'is_staff', 'is_superuser']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ()}),  # Dodatkowe pola (jeśli masz)
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('email', 'username', 'password1', 'password2')}),  # Pola przy tworzeniu
    )