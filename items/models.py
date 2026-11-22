from django.db import models
from django.conf import settings

class LostItem(models.Model):
    STATUS_CHOICES = (
        ('LOST_REPORTED', 'Lost (Reported Missing)'), 
        ('AVAILABLE_CSA', 'Available at CSA'),
        ('AVAILABLE_MAIN', 'Available at MAIN Security Office'),
        ('CLAIMED', 'Claimed by Owner'),
    )

    CATEGORY_CHOICES = (
        ('ELECTRONICS', 'Electronics'),
        ('ID_CARDS', 'ID & Wallets'),
        ('CLOTHING', 'Clothing & Accessories'),
        ('DOCUMENTS', 'Documents'),
        ('OTHER', 'Other'),
    )

    item_name = models.CharField(max_length=100)
    description = models.TextField(help_text="Color, brand, identifying marks, etc.")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    location_found = models.CharField(max_length=255, help_text="Where on the LPU campus was this found or lost?")
    
    date_logged = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE_MAIN')
    
    surrendered_by_name = models.CharField(max_length=255, blank=True, null=True, help_text="Name of the person who turned this in")
    surrendered_by_id = models.CharField(max_length=50, blank=True, null=True, help_text="LPU ID Number (Leave blank if guest)")

    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # --- NEW: CLAIM RECEIPT FIELDS ---
    claimed_by_name = models.CharField(max_length=255, blank=True, null=True)
    claimed_by_email = models.EmailField(blank=True, null=True)
    claimed_date = models.DateField(blank=True, null=True)
    claimed_time = models.TimeField(blank=True, null=True)
    claimed_location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"[{self.get_status_display()}] {self.item_name}"

class SupportTicket(models.Model):
    subject = models.CharField(max_length=200)
    message = models.TextField(help_text="The user's inquiry or issue")
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_submitted = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        status = "RESOLVED" if self.is_resolved else "OPEN"
        return f"[{status}] {self.subject} - {self.submitted_by.email}"

class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50) # e.g., 'ADDED_ITEM', 'DELETED_ITEM'
    description = models.TextField() # e.g., 'Deleted a Lost Item: Black Hydro Flask'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.action_type}] {self.user.email} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"