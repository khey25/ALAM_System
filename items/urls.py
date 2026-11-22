from django.urls import path
from . import views

urlpatterns = [
    # The main feed & filter endpoint: http://127.0.0.1:8000/api/items/
    path('', views.LostItemList.as_view(), name='item-list'),
    
    # The Admin specific item view (e.g., http://127.0.0.1:8000/api/items/3/)
    path('<int:pk>/', views.LostItemDetail.as_view(), name='item-detail'),

    path('bulk-delete/', views.BulkDeleteLostItems.as_view(), name='item-bulk-delete'),

    path('support/', views.SupportTicketListCreate.as_view(), name='support-list'),

    path('activity-history/', views.ActivityLogList.as_view(), name='activity-history'),
]