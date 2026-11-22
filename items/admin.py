from django.contrib import admin
from .models import LostItem

class LostItemAdmin(admin.ModelAdmin):
    list_display = ('item_name', 'status', 'surrendered_by_name', 'location_found', 'date_logged')
    list_filter = ('status', 'date_logged')

    # This hides the dropdown from the form completely
    exclude = ('logged_by',)

    # This automatically sets 'logged_by' to the account currently logged in
    def save_model(self, request, obj, form, change):
        if not obj.pk: # If this is a brand new item
            obj.logged_by = request.user
        super().save_model(request, obj, form, change)

admin.site.register(LostItem, LostItemAdmin)