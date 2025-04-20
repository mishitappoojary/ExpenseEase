# backend/finance_app/views.py
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import TransactionSerializer
from .models import Transaction


from django.contrib.auth.models import update_last_login
from .models import UserProfile
from .serializers import UserSerializer, RegisterSerializer, TransactionSerializer
from rest_framework_simplejwt.exceptions import TokenError

import re
import datetime
import base64
import tempfile
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from paddleocr import PaddleOCR

import requests

API_URL = "https://trove.headline.com/api/v1/transactions/enrich"
API_KEY = "your_api_key"


def homepage(request):
    """
    Simple homepage view that returns JSON or HTML depending on the request.
    """
    if request.headers.get('Accept') == 'application/json':
        return JsonResponse({
            'status': 'success',
            'message': 'Welcome to ExpenseEase API',
            'endpoints': {
                'admin': '/admin/',
                'plaid_api': '/api/plaid/',
                'accounts_api': '/api/accounts/',
                'auth_api': '/api/auth/'
            }
        })
    return render(request, 'homepage.html')

@api_view(['GET'])
def api_root(request):
    """
    API root endpoint that provides links to all available endpoints.
    """
    return Response({
        'status': 'success',
        'message': 'Welcome to ExpenseEase API',
        'endpoints': {
            'admin': '/admin/',
            'plaid_api': '/api/plaid/',
            'accounts_api': '/api/accounts/',
            'auth_api': '/api/auth/'
        }
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protected_endpoint(request):
    return Response({"message": "Access granted! You are authenticated."}, status=200)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user  # Correct way to get user
        update_last_login(None, user)  # Update last login timestamp
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Login View.
    """
    permission_classes = [AllowAny]  # Ensure unauthenticated users can log in
    serializer_class = CustomTokenObtainPairSerializer  # Use the custom serializer

class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom JWT Refresh Token View.
    """
    permission_classes = [AllowAny]

# ✅ Signup View (Using RegisterSerializer)
class SignUpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)  # ✅ Use RegisterSerializer
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ User Profile View
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

# ✅ Logout View (Fixed Exception Handling)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny]) 
def process_receipt(request):
    print("📸 Received request to process receipt")

    if 'image' not in request.FILES:
        print("❌ No image in request")
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        image_file = request.FILES['image']
        print("🖼️ Image received:", image_file.name)

        # ✅ Save in-memory file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            for chunk in image_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name
            print("📂 Saved temporary image at:", temp_path)

        # ✅ Process the image with OCR
        result = process_image_with_ocr(temp_path)
        print("✅ OCR Result:", result)

        # 🗑️ Delete temporary file
        os.unlink(temp_path)
        print("🗑️ Deleted temporary file")

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        print("❌ Error processing receipt:", str(e))
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

OCR_ENGINE = PaddleOCR(use_angle_cls=True, lang="en")

def process_image_with_ocr(image_path):
    print("🔍 Running OCR on image:", image_path)
    result = OCR_ENGINE.ocr(image_path, cls=True)
    text_lines = [word_info[1][0] for line in result for word_info in line]
    print("📄 Extracted text lines:", text_lines)
    
    business_name = extract_business_name(text_lines)
    total_amount = extract_total_amount(text_lines)
    date = extract_date(text_lines)
    
    print("🏢 Business Name:", business_name)
    print("💰 Total Amount:", total_amount)
    print("📅 Date:", date)
    
    return {
        'business_name': business_name,
        'total_amount': total_amount,
        'date': date,
        'raw_text': text_lines
    }

import re

def extract_business_name(text_lines):
    ignore_keywords = {
        "BILL", "INVOICE", "GSTIN", "TAX", "NO", "DATE", "TOTAL", "DUE", 
        "OriginalRecepient", "MOBILE", "NUMBER", "E.&O.E.", "Customer", 
        "TAX INVOICE", "ITEM", "QTY", "AMOUNT", "TABLE", "ORDER TYPE", 
        "SOURCE", "CASHIER", "POWERED", "SGST", "CGST", "FSSAI", "LICENSE", 
        "SUB TOTAL", "MODE OF PAYMENT", "CASH", "BILL TO"
    }
    
    # Step 1️⃣: Check first meaningful line
    for line in text_lines:
        clean_line = line.strip()
        
        if clean_line and not any(keyword in clean_line.upper() for keyword in ignore_keywords):
            return clean_line  # ✅ Use this if it’s valid
        
    # Step 2️⃣: If no valid first word, find the first **ALL-CAPS** business name
    for line in text_lines:
        clean_line = line.strip()
        
        if re.match(r"^[A-Z\s&]+$", clean_line) and len(clean_line) > 2:
            return clean_line  # ✅ Use this as fallback
    
    return "Not Found"



# def extract_total_amount(text_lines):
#     total_keywords = ["TOTAL", "AMOUNT", "GRAND TOTAL", "TOTAL AMOUNT", "AMOUNT DUE"]
#     total_amount = "Not Found"

#     for i, line in enumerate(text_lines):
#         line = line.strip()
        
#         # Check if line contains a total-related keyword
#         if any(keyword.lower() in line.lower() for keyword in total_keywords):
#             # Try to extract amount from "Total: 1110" format
#             match = re.search(r"Total[:\s]*([\d,]+\.\d{2}|\d+)", line, re.IGNORECASE)
#             if match:
#                 return match.group(1)  # Found a valid amount

#             # Try to extract any number within the same line
#             match = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?)", line)
#             if match:
#                 return match.group(1)  # Found an amount in the same line
            
#             # ✅ If "Total" is alone, check the next line for a number
#             if i + 1 < len(text_lines):  # Ensure there's a next line
#                 next_line = text_lines[i + 1].strip()
#                 match = re.match(r"(\d+(?:,\d+)*(?:\.\d+)?)", next_line)
#                 if match:
#                     return match.group(1)  # Use next line as total amount
    
#     return total_amount

def extract_total_amount(text_lines):
    total_amount = "Not Found"

    for i, line in enumerate(text_lines):
        line = line.strip()

        # ✅ Match exact "Total" (not Subtotal, Grand Total, etc.)
        if re.match(r"^\s*Total\s*:?", line, re.IGNORECASE):
            # Try to extract amount from "Total: 1110" format
            match = re.search(r"Total[:\s]*([\d,]+\.\d{2}|\d+)", line, re.IGNORECASE)
            if match:
                return match.group(1)  # Found a valid amount
            
            # ✅ Check the **next line** for the number
            if i + 1 < len(text_lines):  
                next_line = text_lines[i + 1].strip()
                match = re.match(r"(\d+(?:,\d+)*(?:\.\d+)?)", next_line)
                if match:
                    return match.group(1)  

            # ✅ Check the **previous line** for the number
            if i - 1 >= 0:  
                prev_line = text_lines[i - 1].strip()
                match = re.match(r"(\d+(?:,\d+)*(?:\.\d+)?)", prev_line)
                if match:
                    return match.group(1)  
    
    return total_amount



import re
import datetime

def extract_date(text_lines):
    date_keywords = ["DATE", "CREATED", "DUE", "DATED"]
    date = datetime.date.today().strftime("%d/%m/%Y")  # Default to today's date
    
    for line in text_lines:
        line = line.strip()
        if any(keyword in line.upper() for keyword in date_keywords):
            match = re.search(r"(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})", line)
            if match:
                extracted_date = match.group(0)
                
                # Normalize extracted date to dd/mm/yyyy
                # Replace separators with '/'
                extracted_date = extracted_date.replace('.', '/').replace('-', '/')
                
                # Split by '/' to handle day, month, and year
                day, month, year = extracted_date.split('/')
                
                # If year is two digits, adjust it to four digits (e.g., '25' -> '2025')
                if len(year) == 2:
                    year = '20' + year
                
                # Return the date in the desired format
                date = f"{day}/{month}/{year}"
                break
    
    return date

@csrf_exempt  # ✅ Disable CSRF for this view
@api_view(['POST'])
def add_transaction(request):
    transaction_data = request.data

    # Check for duplicates only for SMS transactions
    if transaction_data['source'] == 'sms':
        if Transaction.objects.filter(ref_number=transaction_data['ref_number']).exists():
            return Response({"detail": "Transaction with this ref_number already exists."}, status=status.HTTP_400_BAD_REQUEST)

    # Save the transaction (whether it's SMS, OCR, or Manual)
    serializer = TransactionSerializer(data=transaction_data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class TransactionListCreateView(generics.ListCreateAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        transaction_data = self.request.data
        
        # Check for duplicates only if source is SMS
        if transaction_data['source'] == 'sms':
            if Transaction.objects.filter(ref_number=transaction_data['ref_number']).exists():
                existing = Transaction.objects.get(ref_number=transaction_data['ref_number'])
                serializer = TransactionSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Save the transaction
        serializer.save(user=self.request.user)

@csrf_exempt
def get_merchant_category(request):
    if request.method == "POST":
        merchant = request.data.get("merchant")

        if merchant:
            try:
                payload = {"description": merchant, "date": "2023-08-06", "user_id": "TROVEUSER1"}
                headers = {"X-API-KEY": API_KEY, "Content-Type": "application/json"}

                response = requests.post(API_URL, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    category = data.get("categories", [None])[0]  # Extract category if available
                    return JsonResponse({"category": category})

                return JsonResponse({"error": "Unable to fetch category"}, status=500)

            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)
        return JsonResponse({"error": "Merchant data not provided"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

class DeleteAllTransactionsView(APIView):
    def delete(self, request):
        Transaction.objects.all().delete()  # Deletes all transactions
        return Response(status=status.HTTP_204_NO_CONTENT)