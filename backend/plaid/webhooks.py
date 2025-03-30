import hashlib
import hmac
import logging
import time

from jose import jwt

from backend.plaid.models import Item
from backend.plaid.services import PlaidDatabaseService
from backend.plaid.tasks import update_transactions
from backend.plaid.utils import plaid_config
from plaid.model.webhook_verification_key_get_request import (
    WebhookVerificationKeyGetRequest,
)

logger = logging.getLogger(__name__)

# Cache for webhook validation keys.
KEY_CACHE = {}

def verify_webhook(body: bytes, headers: dict) -> bool:
    """
    Plaid webhook verification: https://plaid.com/docs/api/webhooks/webhook-verification/
    """
    signed_jwt = headers.get("plaid-verification")
    if not signed_jwt:
        logger.error("Missing Plaid verification header.")
        return False
    
    try:
        current_key_id = jwt.get_unverified_header(signed_jwt)["kid"]
    except Exception as e:
        logger.error(f"Failed to extract key ID: {str(e)}")
        return False
    
    if current_key_id not in KEY_CACHE:
        try:
            request = WebhookVerificationKeyGetRequest(key_id=current_key_id)
            res = plaid_config.client.webhook_verification_key_get(request)
            key_data = res.to_dict().get("key")
            if key_data:
                KEY_CACHE[current_key_id] = key_data
        except Exception as e:
            logger.error(f"Failed to fetch verification key: {str(e)}")
            return False

    key = KEY_CACHE.get(current_key_id)
    if not key or key.get("expired_at"):
        logger.error("Verification key is missing or expired.")
        return False
    
    try:
        claims = jwt.decode(signed_jwt, key, algorithms=["ES256"])
    except Exception as e:
        logger.error(f"JWT verification failed: {str(e)}")
        return False

    if claims.get("iat", 0) < time.time() - 5 * 60:
        logger.error("JWT is too old.")
        return False

    body_hash = hashlib.sha256(body).hexdigest()
    return hmac.compare_digest(body_hash, claims.get("request_body_sha256", ""))

def handle_item_webhook(webhook_code: str, item_id: str, error: dict) -> None:
    """
    Handle item webhook.
    """
    item = Item.objects.filter(item_id=item_id).first()
    if not item:
        logger.error(f"Item with ID {item_id} not found.")
        return

    service = PlaidDatabaseService(item)
    
    if webhook_code == "ERROR":
        if error.get("error_code") == "ITEM_LOGIN_REQUIRED":
            service.update_item_to_bad_state()
            logger.info("Plaid Item updated to bad state.")
        else:
            logger.warning(f"Unhandled ITEM error: {error.get('error_message')}")
    
    elif webhook_code == "PENDING_EXPIRATION":
        service.update_item_to_bad_state()
        logger.info("Plaid Item pending expiration.")

    elif webhook_code == "NEW_ACCOUNTS_AVAILABLE":
        service.update_item_new_accounts_detected()
        logger.info("New accounts detected for Plaid Item.")

def handle_transactions_webhook(webhook_code: str, item_id: str) -> None:
    """
    Handle transactions webhook.
    """
    if webhook_code == "SYNC_UPDATES_AVAILABLE":
        item = Item.objects.filter(item_id=item_id).first()
        if item:
            update_transactions.delay(item.id)
            logger.info(f"Triggered transaction sync for item {item_id}.")
        else:
            logger.error(f"Item {item_id} not found, cannot update transactions.")
