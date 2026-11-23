from rest_framework import serializers
from .models import LostItem, SupportTicket, ActivityLog


class LostItemSerializer(serializers.ModelSerializer):
    logged_by = serializers.StringRelatedField(read_only=True)
    reporter_email = serializers.CharField(source='logged_by.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = LostItem
        fields = '__all__'
        read_only_fields = ['id', 'date_logged', 'logged_by']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin = bool(
            request
            and request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )
        if not is_admin:
            data.pop('reporter_email', None)
            data.pop('logged_by', None)
        return data


class SupportTicketSerializer(serializers.ModelSerializer):
    submitted_by_email = serializers.StringRelatedField(source='submitted_by', read_only=True)

    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['id', 'date_submitted', 'submitted_by', 'is_resolved']


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['id', 'user', 'action_type', 'description', 'timestamp']