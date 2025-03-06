# backend/finance_app/views.py
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

def homepage(request):
    """
    Simple homepage view that returns HTML or JSON depending on the request.
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
    else:
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
