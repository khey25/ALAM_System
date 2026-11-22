from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import CustomUser
from django.core.mail import send_mail
from django.conf import settings
from items.models import ActivityLog # <--- IMPORT THE LOG MODEL HERE
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, authentication_classes


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def setup_account(request):
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    student_id = email.split('@')[0]
    
    user, created = CustomUser.objects.get_or_create(
        email=email, 
        defaults={
            'username': student_id,
            'role': 'STUDENT'
        }
    )
    
    token, _ = Token.objects.get_or_create(user=user)
    magic_link = f"{settings.FRONTEND_URL}/set-password/?token={token.key}"
    
    try:
        send_mail(
            subject="ALAM System: Set Up Your Account",
            message=f"Welcome to the ALAM System!\n\nPlease click the link below to securely set your password and activate your account:\n\n{magic_link}\n\nIf you did not request this, please ignore this email.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'Verification link sent successfully'})
    except Exception as e:
        print("\n=== GOOGLE SMTP ERROR (SETUP) ===")
        print(e)
        print("=================================\n")
        return Response({"error": "Failed to send email due to network/SMTP issue."}, status=500)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password')
    
    try:
        user = CustomUser.objects.get(email=email)
        if user.check_password(password):
            # THE FIX: Generate a secure, expiring JWT instead of a static token
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'role': user.role
            })
    except CustomUser.DoesNotExist:
        pass
        
    return Response({'error': 'Invalid credentials or account does not exist'}, status=401)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def set_password(request):
    token_key = request.data.get('token')
    new_password = request.data.get('password')

    if not token_key or not new_password:
        return Response({'error': 'Token and password are required'}, status=400)

    try:
        token = Token.objects.get(key=token_key)
        user = token.user
        user.set_password(new_password)
        user.save()
        token.delete()  # Invalidates the magic link after a single use
        return Response({'message': 'Password set successfully'})
    except Token.DoesNotExist:
        return Response({'error': 'Invalid or expired token'}, status=400)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def forgot_password(request):
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        user = CustomUser.objects.get(email=email)
        token, _ = Token.objects.get_or_create(user=user)
        reset_link = f"{settings.FRONTEND_URL}/set-password/?token={token.key}"
        
        send_mail(
            subject="ALAM System: Reset Your Password",
            message=f"We received a request to reset your ALAM System password.\n\nPlease click the link below to choose a new password:\n\n{reset_link}\n\nIf you did not request this, you can safely ignore this email.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
    except CustomUser.DoesNotExist:
        pass
    except Exception as e:
        print("\n=== GOOGLE SMTP ERROR (FORGOT PASSWORD) ===")
        print(e)
        print("===========================================\n")
        return Response({"error": "Failed to send reset email due to network/SMTP issue."}, status=500)
        
    return Response({'message': 'If an account exists, a reset link has been sent.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def support_message(request):
    name = request.data.get('name')
    subject = request.data.get('subject')
    message = request.data.get('message')
    
    user_email = request.user.email
    full_message = f"New support request from: {name}\nUser's Registered Email: {user_email}\n\nMessage:\n{message}"

    try:
        send_mail(
            subject=f"[ALAM Support] {subject}",
            message=full_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        return Response({"message": "Email sent successfully"}, status=200)
    except Exception as e:
        print("\n=== GOOGLE SMTP ERROR ===")
        print(e)
        print("=========================\n")
        return Response({"error": str(e)}, status=500)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def account_profile(request):
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'username': user.username,
            'email': user.email,
            'id_number': user.id_number or '',
            'role': user.role,
            'full_name': user.full_name or '',
            'contact_number': user.contact_number or '',
        })
        
    elif request.method == 'PUT':
        user.full_name = request.data.get('full_name', user.full_name)
        user.contact_number = request.data.get('contact_number', user.contact_number)
        user.save()
        
        # --- NEW: LOG PROFILE UPDATE ---
        ActivityLog.objects.create(
            user=user,
            action_type='EDIT_PROFILE',
            description="Updated personal account details (Name/Contact)."
        )
        
        return Response({'message': 'Profile updated successfully'})