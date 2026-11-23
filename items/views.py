from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LostItem, SupportTicket, ActivityLog
from .serializers import LostItemSerializer, SupportTicketSerializer, ActivityLogSerializer


class IsAdminRole(BasePermission):
    """Strictly allows access only to authenticated ADMIN users."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class LostItemList(generics.ListCreateAPIView):
    serializer_class = LostItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = LostItem.objects.all().order_by('-date_logged')
        is_admin = self.request.user.is_authenticated and self.request.user.role == 'ADMIN'

        reports_view = self.request.query_params.get('reports', None)
        if reports_view == 'true':
            if not is_admin:
                raise PermissionDenied("Only admins can view submitted reports.")
            return queryset.exclude(logged_by__role='ADMIN')

        public_view = self.request.query_params.get('public', None)
        if public_view == 'true':
            return queryset.filter(status__in=['AVAILABLE_MAIN', 'AVAILABLE_CSA'])

        found_view = self.request.query_params.get('found', None)
        if found_view == 'true':
            return queryset.filter(status='CLAIMED')

        # Non-admins can never list private LOST_REPORTED records
        if not is_admin:
            queryset = queryset.filter(status__in=['AVAILABLE_MAIN', 'AVAILABLE_CSA', 'CLAIMED'])

        status_param = self.request.query_params.get('status', None)
        if status_param is not None:
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        if self.request.user.role == 'GUEST':
            raise PermissionDenied("Guests cannot submit item reports.")

        if self.request.user.role == 'ADMIN':
            item = serializer.save(logged_by=self.request.user)
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='ADD_ITEM',
                description=f"Added an item to the system: '{item.item_name}'."
            )
        else:
            # Force non-admin submissions to private LOST_REPORTED status
            item = serializer.save(logged_by=self.request.user, status='LOST_REPORTED')
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='SUBMIT_REPORT',
                description=f"Submitted a lost item report for: '{item.item_name}'."
            )


class LostItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action_type='DELETE_ITEM',
            description=f"Deleted item record: '{instance.item_name}'."
        )
        instance.delete()


class BulkDeleteLostItems(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        item_ids = request.data.get('item_ids', [])
        if not item_ids:
            return Response({"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

        items_to_delete = LostItem.objects.filter(id__in=item_ids)
        deleted_count = items_to_delete.count()

        if deleted_count > 0:
            ActivityLog.objects.create(
                user=request.user,
                action_type='BULK_DELETE',
                description=f"Permanently removed {deleted_count} items from the system."
            )

        items_to_delete.delete()
        return Response({"message": "Items deleted successfully"}, status=status.HTTP_200_OK)


class SupportTicketListCreate(generics.ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins can see all tickets; Students/Staff can only see their own
        if self.request.user.role == 'ADMIN':
            return SupportTicket.objects.all().order_by('-date_submitted')
        return SupportTicket.objects.filter(submitted_by=self.request.user).order_by('-date_submitted')

    def perform_create(self, serializer):
        if self.request.user.role == 'GUEST':
            raise PermissionDenied("Guests cannot submit support tickets.")
        ticket = serializer.save(submitted_by=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user,
            action_type='SUBMIT_TICKET',
            description=f"Submitted a support ticket regarding: '{ticket.subject}'."
        )


class ActivityLogList(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        # Strictly ADMIN-only. Change to ActivityLog.objects.all().order_by('-timestamp')
        # if you want Admins to view every user's activity instead of only their own.
        return ActivityLog.objects.filter(user=self.request.user).order_by('-timestamp')