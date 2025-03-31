# settings.py
import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-15s+x8!v7=5))%xit7&vphm88^mp)(zjnp)_1*5u1%_$6(0_ms'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ALLOWED_HOSTS = ['*']

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
]

THIRD_PARTY_APPS = [
    "rest_framework",  # for building API
    "rest_framework.authtoken",
    "corsheaders",    # for handling CORS
    "allauth",        # if you're using it for authentication
    "allauth.account",
    "allauth.mfa",
]

LOCAL_APPS = [
    "backend.common",
    "backend.accounts",
    "backend.plaid",
    "backend.finance_app",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

APP_NAME = "ExpenseEase"
CLIENT_NAME = "ExpenseEase"

PLAID_PRODUCTS = ["transactions", "auth", "identity"] # comma-separated list of Plaid products
PLAID_COUNTRY_CODES = ["US", "CA"] # comma-separated list of country codes
PLAID_ENV = 'sandbox'  # sandbox or production

PLAID_CLIENT_ID="671221491d546a0019a1859a"
PLAID_SECRET="bec2b4517049ec2a616759317f63cc"
PLAID_ENV="sandbox"
DEBUG=True
CELERY_BROKER_URL="redis://localhost:6379/0"
APP_URL="http://localhost:8000",

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'backend.finance_app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [ os.path.join(BASE_DIR, 'backend', 'templates') ],
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

# backend/finance_app/settings.py



WSGI_APPLICATION = 'backend.finance_app.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # 'rest_framework.authentication.SessionAuthentication',
        # 'rest_framework.authentication.BasicAuthentication',
        # 'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Short expiry for security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,  # Generates a new refresh token on refresh
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),  # Must match frontend
}

# CORS settings for React Native
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:19006",  # Expo default port
    "http://10.0.2.2:8000",
    "http://10.0.2.2:19000",
    "http://192.168.29.253:8000",
]

CORS_ALLOW_CREDENTIALS = True
# CORS_ALLOW_ALL_ORIGINS = True  # Be careful with this in production
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

CSRF_TRUSTED_ORIGINS = ['http://192.168.29.253:8000', "http://192.168.29.253:3000", 'http://127.0.0.1:8000', 'http://10.0.2.2:8000' ]
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS

from django.middleware.csrf import CsrfViewMiddleware

class DisableCSRFOnJWT(CsrfViewMiddleware):
    def _reject(self, request, reason):
        if request.path.startswith('/api/token/'):
            return None  # Disable CSRF for token endpoints
        return super()._reject(request, reason)

MIDDLEWARE.insert(4, 'backend.finance_app.settings.base.DisableCSRFOnJWT')