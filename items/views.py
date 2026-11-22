from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LostItem, SupportTicket, ActivityLog
from .serializers import LostItemSerializer, SupportTicketSerializer, ActivityLogSerializer

class LostItemList(generics.ListCreateAPIView):
    serializer_class = LostItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 

    def get_queryset(self):
        queryset = LostItem.objects.all().order_by('-date_logged')
        public_view = self.request.query_params.get('public', None)
        if public_view == 'true':
            return queryset.filter(status__in=['AVAILABLE_MAIN', 'AVAILABLE_CSA'])
            
        found_view = self.request.query_params.get('found', None)
        if found_view == 'true':
            return queryset.filter(status='CLAIMED')
            
        reports_view = self.request.query_params.get('reports', None)
        if reports_view == 'true':
            return queryset.exclude(logged_by__role='ADMIN')
            
        status_param = self.request.query_params.get('status', None)
        if status_param is not None:
            queryset = queryset.filter(status=status_param)
            
        return queryset

    def perform_create(self, serializer):
        item = serializer.save(logged_by=self.request.user)
        
        # --- THE FIX: Role-based logging ---
        if self.request.user.role == 'ADMIN':
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='ADD_ITEM',
                description=f"Added an item to the system: '{item.item_name}'."
            )
        else:
            # This catches the Student/Staff report submission
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='SUBMIT_REPORT',
                description=f"Submitted a lost item report for: '{item.item_name}'."
            )

class LostItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if self.request.user.role == 'ADMIN':
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='DELETE_ITEM',
                description=f"Deleted item record: '{instance.item_name}'."
            )
        instance.delete()

class BulkDeleteLostItems(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
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
    queryset = SupportTicket.objects.all().order_by('-date_submitted')
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ticket = serializer.save(submitted_by=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user,
            action_type='SUBMIT_TICKET',
            description=f"Submitted a support ticket regarding: '{ticket.subject}'."
        )

class ActivityLogList(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # This securely ensures Students/Staff only fetch their own personal history
        return ActivityLog.objects.filter(user=self.request.user).order_by('-timestamp')