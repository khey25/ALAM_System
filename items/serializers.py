from rest_framework import serializers
from .models import LostItem
from .models import SupportTicket
from .models import ActivityLog

class LostItemSerializer(serializers.ModelSerializer):
    # Your original line: grabs the user's string representation (ID - Role)
    logged_by = serializers.StringRelatedField(read_only=True) 
    
    # THE ARCHITECTURE FIX: Securely extracts the true email for the Admin Reports badge
    reporter_email = serializers.CharField(source='logged_by.email', read_only=True)
    
    # Translates the backend codes into human-readable text for React
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = LostItem
        fields = '__all__'
        
        # Security measure: Prevents users from manipulating the submission time
        read_only_fields = ['date_logged']

class SupportTicketSerializer(serializers.ModelSerializer):
    # Grabs the user's email so the Admin knows who submitted it
    submitted_by_email = serializers.StringRelatedField(source='submitted_by', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['date_submitted', 'submitted_by', 'is_resolved']

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'