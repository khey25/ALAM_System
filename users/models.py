from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # The 4 specific roles for the ALAM system
    ROLE_CHOICES = (
        ('ADMIN', 'Admin / Security'),
        ('STUDENT', 'Student'),
        ('STAFF', 'Staff / Faculty'),
        ('GUEST', 'Guest'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='GUEST')
    id_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
            if '@' in self.email:
                self.id_number = self.email.split('@')[0]
        elif self.id_number == '':
            self.id_number = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} - {self.role}"