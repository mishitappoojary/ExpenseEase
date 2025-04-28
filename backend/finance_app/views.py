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
from rest_framework import viewsets
from rest_framework.decorators import action
from decimal import Decimal

from .serializers import TransactionSerializer
from .models import Transaction, BudgetCategory, Budget, DynamicBudget
from .models import Goal
from .serializers import GoalSerializer, BudgetCategorySerializer, BudgetSerializer, BudgetSummarySerializer, SuggestedBudgetSerializer, DynamicBudgetSerializer

from google.cloud import dialogflow_v2 as dialogflow
import uuid
from datetime import timedelta
from django.utils import timezone

from django.contrib.auth.models import update_last_login
from django.db.models import Sum
from .models import UserProfile
from .serializers import UserSerializer, RegisterSerializer, TransactionSerializer
from rest_framework_simplejwt.exceptions import TokenError

import re
import datetime
import base64
import tempfile
import os
from nltk.sentiment import SentimentIntensityAnalyzer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from paddleocr import PaddleOCR

import requests
import logging
import random
from django.conf import settings

#API_URL = "https://trove.headline.com/api/v1/transactions/enrich"
#API_KEY = "your_api_key"

logger = logging.getLogger(__name__)


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
                'auth_api': '/api/auth/',
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
            'auth_api': '/api/auth/',
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

class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def get_unknown_transactions(request):
    user = request.user
    unknowns = Transaction.objects.filter(user=user, category__iexact='unknown')
    serializer = TransactionSerializer(unknowns, many=True)
    return Response(serializer.data)

@api_view(['PATCH'])
def bulk_update_category(request):
    user = request.user
    description = request.data.get('description', '').lower()
    new_category = request.data.get('category')

    if not description or not new_category:
        return Response({'error': 'Invalid data'}, status=400)

    updated = Transaction.objects.filter(user=user, description__iexact=description)
    
    if not updated.exists():
        return Response({'message': 'No transactions found to update.'}, status=404)

    updated.update(category=new_category)
    return Response({'message': f'Updated {updated.count()} transactions.'})

class GoalViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated] 
    # List all goals
    def list(self, request):
        goals = Goal.objects.filter(user=request.user)
        serializer = GoalSerializer(goals, many=True)
        return Response(serializer.data)

    # Create a new goal
    def create(self, request):
        print(f"Request Data: {request.data}") 
        serializer = GoalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        else:
            print(f"Serializer Errors: {serializer.errors}")
            return Response(serializer.errors, status=400)

    # Retrieve a specific goal
    def retrieve(self, request, pk=None):
        goal = Goal.objects.get(pk=pk)
        serializer = GoalSerializer(goal)
        return Response(serializer.data)

    # Update a specific goal
    def update(self, request, pk=None):
        goal = Goal.objects.get(pk=pk)
        serializer = GoalSerializer(goal, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # Delete a specific goal
    def destroy(self, request, pk=None):
        goal = Goal.objects.get(pk=pk)
        goal.delete()
        return Response(status=204)

    # Update goal progress
    def update_progress(self, request, pk=None):
        goal = Goal.objects.get(pk=pk)
        goal.progress += 1000  # Increment by 100, or any logic you wish
        goal.save()
        return Response({'status': 'progress updated'})
             
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
    

# Dynamic Budgeting

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_dynamic_budget(request):
    """
    Auto-create a budget based on user's past spending.
    """
    user = request.user
    period = request.data.get("period", "monthly")  # Default to monthly

    # Analyze past 90 days transactions
    past_transactions = Transaction.objects.filter(
        user=user, 
        date__gte=timezone.now() - timedelta(days=90)
    )

    if not past_transactions.exists():
        return Response({"error": "Not enough transaction data"}, status=400)

    spending_by_category = (
        past_transactions.values("category")
        .annotate(total_spent=Sum("amount"))
        .order_by("-total_spent")
    )

    # Clear old dynamic budgets
    DynamicBudget.objects.filter(user=user, period=period).delete()

    budgets_created = []
    for category_data in spending_by_category:
        category = category_data["category"]
        spent = abs(category_data["total_spent"])

        if spent < 10:  # Ignore categories with very low spending
            continue

        # Example: budget 90% of past average spending for that category
        average_spent = spent / 3  # 3 months
        budget_amount = average_spent * Decimal(0.9 if period == "monthly" else 0.2)

        dynamic_budget = DynamicBudget.objects.create(
            user=user,
            period=period,
            category=category,
            amount=budget_amount
        )
        budgets_created.append(dynamic_budget)

    serializer = DynamicBudgetSerializer(budgets_created, many=True)
    return Response(serializer.data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dynamic_budgets(request):
    user = request.user
    period = request.query_params.get("period", "monthly")
    budgets = DynamicBudget.objects.filter(user=user, period=period)
    serializer = DynamicBudgetSerializer(budgets, many=True)
    return Response(serializer.data)


# Budgeting feature
class BudgetCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BudgetCategory.objects.filter(user=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        budget = serializer.save(user=self.request.user)
        budget.adjust_budget()

class BudgetSummaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Fetch all budgets for the user, optimizing with select_related for the category
        budgets = Budget.objects.filter(user=user).select_related('category')

        # Serialize the budgets using the BudgetSummarySerializer
        summary_data = BudgetSummarySerializer(budgets, many=True)

        # Return the serialized data in the response
        return Response(summary_data.data)
    
class BudgetSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Last 3 months of transactions
        three_months_ago = timezone.now() - timedelta(days=90)
        transactions = Transaction.objects.filter(user=user, date__gte=three_months_ago)

        category_totals = {}
        category_counts = {}

        for txn in transactions:
            category = txn.category.name if txn.category else "Uncategorized"
            category_totals[category] = category_totals.get(category, 0) + txn.amount
            category_counts[category] = category_counts.get(category, 0) + 1

        suggestions = []
        for category, total_amount in category_totals.items():
            count = category_counts[category]
            avg_per_month = (total_amount / 3)  # 3 months
            suggestions.append({
                "category": category,
                "suggested_amount": round(avg_per_month * 1.1, 2)  # Add 10% buffer
            })

        return Response(SuggestedBudgetSerializer(suggestions, many=True).data)

# Financial Insights
#     
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def investment_recommendations(request):
    try:
        query = request.GET.get("query", "tech")
        user = request.user
        
        # Fetch spending data
        spending = (
            Transaction.objects.filter(user=user)
            .values('category')
            .annotate(total_amount=Sum('amount'))
            .order_by('-total_amount')
        )

        spending_dict = {s['category']: float(abs(s['total_amount'])) for s in spending}

        # Fetch sentiment + articles from Twitter and News
        twitter_sentiment, twitter_articles = fetch_twitter_sentiment(query)
        news_sentiment, news_articles = fetch_news_sentiment(query)

        # Simple recommendations
        recommendations = generate_dynamic_recommendations(twitter_sentiment, news_sentiment, query, spending_dict)

        return Response({
            "spending": spending_dict,
            "sentiment": {
                "twitter": {
                    "avg": twitter_sentiment,
                    "articles": twitter_articles
                },
                "news": {
                    "avg": news_sentiment,
                    "articles": news_articles
                }
            },
            "recommendations": recommendations
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error in investment recommendations: {str(e)}")
        return Response({"error": "Something went wrong"}, status=500)


def generate_dynamic_recommendations(twitter_sentiment, news_sentiment, query, user_spending):
    recommendations = []
    
    # Check sentiment scores for Twitter and News
    if twitter_sentiment > 0.2 and news_sentiment > 0.2:
        recommendations.append(f"Strong positive sentiment detected in {query}. Consider increasing your investments or research more in {query}-related stocks.")
    elif twitter_sentiment < -0.2 or news_sentiment < -0.2:
        recommendations.append(f"Both social media and news are showing negative sentiment towards {query}. It might be wise to avoid heavy investments in {query} right now.")
    elif -0.2 <= twitter_sentiment <= 0.2 and -0.2 <= news_sentiment <= 0.2:
        recommendations.append(f"Sentiment around {query} is neutral. Keep an eye on further developments before making major investment decisions.")
    
    # Spending insights: Diversification
    top_spending_category = max(user_spending, key=user_spending.get, default=None)
    if top_spending_category and user_spending.get(top_spending_category, 0) > 1000:  # Example threshold for heavy spending
        recommendations.append(f"Your spending is heavily concentrated in {top_spending_category}. Consider diversifying your investments to reduce risk.")
    
    # Spending insights: Total spending
    total_spending = sum(user_spending.values())
    if total_spending > 5000:  # Example threshold for total spending
        recommendations.append("Your total spending has been high this month. Consider adjusting your budget or reallocating funds to ensure financial stability.")
    
    return recommendations

    
def fetch_news_sentiment(query):
    try:
        sia = SentimentIntensityAnalyzer()

        url = f"https://newsapi.org/v2/everything?q={query}&apiKey={settings.NEWS_API_KEY}&pageSize=10"
        response = requests.get(url)
        articles = response.json().get('articles', [])

        if not articles:
            return 0.0, []

        article_data = []
        sentiment_scores = []

        for article in articles:
            title = article.get('title', '')
            url = article.get('url', '')

            if title:
                score = sia.polarity_scores(title)['compound']
                sentiment_scores.append(score)

            article_data.append({
                "title": title,
                "url": url
            })

        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0

        return avg_sentiment, article_data

    except Exception as e:
        logger.error(f"Error fetching news sentiment: {str(e)}")
        return 0.0, []

def fetch_twitter_sentiment(query):
    try:
        sia = SentimentIntensityAnalyzer()

        headers = {
            "Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"
        }
        url = f"https://api.twitter.com/2/tweets/search/recent?query={query}&max_results=10&tweet.fields=author_id,created_at"
        response = requests.get(url, headers=headers)
        tweets = response.json().get('data', [])

        if not tweets:
            return 0.0, []

        tweet_data = []
        sentiment_scores = []

        for tweet in tweets:
            tweet_id = tweet.get('id')
            text = tweet.get('text', '')
            author_id = tweet.get('author_id')

            if text:
                score = sia.polarity_scores(text)['compound']
                sentiment_scores.append(score)

            tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"

            tweet_data.append({
                "text": text,
                "url": tweet_url
            })

        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0

        return avg_sentiment, tweet_data

    except Exception as e:
        logger.error(f"Error fetching twitter sentiment: {str(e)}")
        return 0.0, []
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chatbot_query(request):
    try:
        user_message = request.data.get("message")
        if not user_message:
            return Response({"error": "No message provided"}, status=400)

        # Unique session per user
        session_id = str(request.user.id) or str(uuid.uuid4())
        session_client = dialogflow.SessionsClient()
        session = session_client.session_path("capitalguard-451015", session_id)

        text_input = dialogflow.TextInput(text=user_message, language_code="en")
        query_input = dialogflow.QueryInput(text=text_input)

        response = session_client.detect_intent(session=session, query_input=query_input)

        bot_reply = response.query_result.fulfillment_text

        return Response({
            "reply": bot_reply
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
