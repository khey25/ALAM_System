from django.urls import path
from . import views

urlpatterns = [
    path('setup/', views.setup_account, name='setup_account'),
    path('login/', views.login_user, name='login_user'),
    path('set-password/', views.set_password, name='set_password'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('profile/', views.account_profile, name='account_profile'),
    path('support/', views.support_message, name='support_message')
]