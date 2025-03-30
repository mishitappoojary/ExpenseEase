# settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    'django.contrib.sites',
]

THIRD_PARTY_APPS = [
    "rest_framework",  # for building API
    'rest_framework.authtoken',
    "corsheaders",    # for handling CORS
    "allauth",        # if you're using it for authentication
    "allauth.account",
    "allauth.mfa",
    'allauth.socialaccount',
]

LOCAL_APPS = [
    "backend.common",
    "backend.accounts",
    "backend.plaid",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


PLAID_PRODUCTS = ["transactions", "auth", "identity"] # comma-separated list of Plaid products
PLAID_COUNTRY_CODES = ["US", "CA"]  # comma-separated list of country codes
PLAID_ENV = 'sandbox'  # sandbox or production

APP_NAME = "ExpenseEase"
CLIENT_NAME = "ExpenseEase"
PLAID_CLIENT_ID="671221491d546a0019a1859a"
PLAID_SECRET="bec2b4517049ec2a616759317f63cc"
PLAID_ENV="sandbox"
DEBUG=True
CELERY_BROKER_URL="redis://localhost:6379/0"
APP_URL="http://localhost:8000"

# Remove these lines if they exist
# TAILWIND_APP_NAME = "theme"
# COTTON_DIR = "components"

# backend/finance_app/settings.py

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "backend" / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]




# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Add CORS settings for React Native
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:19006",  # Expo default port
    "http://10.0.2.2:8000",
    "http://10.0.2.2:19000", 
]

# allauth settings
SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# allauth settings
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_UNIQUE_EMAIL = True


CORS_ALLOW_CREDENTIALS = True

# If you're using React Native, you might want to allow all headers
CORS_ALLOW_ALL_ORIGINS = True  # Be careful with this in production
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
