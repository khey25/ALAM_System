from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from items.models import ActivityLog
from .models import CustomUser

MAGIC_LINK_EXPIRY_MINUTES = 10


def _issue_fresh_token(user):
    """Delete any previous link token and issue a fresh one with a new 10-minute timer."""
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


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

    token = _issue_fresh_token(user)
    magic_link = f"{settings.FRONTEND_URL}/set-password/?token={token.key}&type=setup"

    try:
        send_mail(
            subject="ALAM System: Set Up Your Account",
            message=(
                "Welcome to the ALAM System!\n\n"
                "Please click the link below to securely set your password and activate your account:\n\n"
                f"{magic_link}\n\n"
                f"This link will expire in {MAGIC_LINK_EXPIRY_MINUTES} minutes. "
                "If it expires, you can request a new link from the login page.\n\n"
                "If you did not request this, please ignore this email."
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'Verification link sent successfully'})
    except Exception as e:
        print("\n=== EMAIL ERROR (SETUP) ===")
        print(e)
        print("===========================\n")
        return Response({"error": "Failed to send email due to network/email service issue."}, status=500)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password')

    try:
        user = CustomUser.objects.get(email=email)
        if user.check_password(password):
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
    except Token.DoesNotExist:
        return Response(
            {'error': 'This link is invalid or has already been used. Please request a new link.', 'expired': True},
            status=400
        )

    if timezone.now() - token.created > timedelta(minutes=MAGIC_LINK_EXPIRY_MINUTES):
        token.delete()
        return Response(
            {
                'error': f'This link has expired (valid for {MAGIC_LINK_EXPIRY_MINUTES} minutes only). Please request a new link.',
                'expired': True
            },
            status=400
        )

    user = token.user
    user.set_password(new_password)
    user.save()
    token.delete()  # Invalidates the magic link after a single use
    return Response({'message': 'Password set successfully'})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def forgot_password(request):
    email = (request.data.get('email') or '').strip().lower()
    if not email:
        return Response({'error': 'Email is required'}, status=400)

    try:
        user = CustomUser.objects.get(email=email)
        token = _issue_fresh_token(user)
        reset_link = f"{settings.FRONTEND_URL}/set-password/?token={token.key}&type=forgot"

        send_mail(
            subject="ALAM System: Reset Your Password",
            message=(
                "We received a request to reset your ALAM System password.\n\n"
                "Please click the link below to choose a new password:\n\n"
                f"{reset_link}\n\n"
                f"This link will expire in {MAGIC_LINK_EXPIRY_MINUTES} minutes. "
                "If it expires, you can request a new reset link from the login page.\n\n"
                "If you did not request this, you can safely ignore this email."
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
    except CustomUser.DoesNotExist:
        pass
    except Exception as e:
        print("\n=== EMAIL ERROR (FORGOT PASSWORD) ===")
        print(e)
        print("=====================================\n")
        return Response({"error": "Failed to send reset email due to network/email service issue."}, status=500)

    return Response({'message': 'If an account exists, a reset link has been sent.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def support_message(request):
    name = request.data.get('name')
    subject = request.data.get('subject')
    message = request.data.get('message')

    user_email = request.user.email
    full_message = f"FROM: {name}\nEMAIL: {user_email}\n\nMESSAGE:\n{message}"

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
        print("\n=== EMAIL ERROR (SUPPORT) ===")
        print(e)
        print("=============================\n")
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

        ActivityLog.objects.create(
            user=user,
            action_type='EDIT_PROFILE',
            description="Updated personal account details (Name/Contact)."
        )

        return Response({'message': 'Profile updated successfully'})