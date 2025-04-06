import pytesseract
import re
from PIL import Image
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from .models import Transaction
import json

@csrf_exempt
def process_receipt(request):
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            user_id = request.POST.get('user_id')  # Get user ID from request
            if not user_id:
                return JsonResponse({'status': 'error', 'message': 'User ID required'}, status=400)

            user = User.objects.get(id=user_id)  # Fetch the user

            # Save uploaded image temporarily
            uploaded_file = request.FILES['image']
            file_path = default_storage.save('temp_receipt.jpg', ContentFile(uploaded_file.read()))

            # Open image for OCR processing
            image = Image.open(default_storage.open(file_path))
            extracted_text = pytesseract.image_to_string(image)

            # Extract transaction amount
            amount_match = re.findall(r'(?:₹|\$|€)?\s?(\d{1,}[,.]?\d{0,2})', extracted_text)

            if amount_match:
                extracted_amount = float(amount_match[-1].replace(',', ''))  # Convert to float

                # Save transaction
                transaction = Transaction.objects.create(
                    user=user,
                    amount=extracted_amount,
                    description="Scanned Bill"
                )

                return JsonResponse({
                    'status': 'success',
                    'transaction': {
                        'id': transaction.id,
                        'amount': str(transaction.amount),
                        'description': transaction.description,
                        'date': transaction.date.strftime('%Y-%m-%d %H:%M:%S'),
                    }
                })

            else:
                return JsonResponse({'status': 'error', 'message': 'No amount found'})

        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)
