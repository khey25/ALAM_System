from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Tells the dashboard to display your custom ALAM fields
class CustomUserAdmin(UserAdmin):
    readonly_fields = ('id_number',)
    fieldsets = UserAdmin.fieldsets + (
        ('ALAM System Details', {'fields': ('role', 'id_number', 'full_name', 'contact_number')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)