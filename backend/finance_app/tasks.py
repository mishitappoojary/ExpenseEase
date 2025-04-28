from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

@shared_task
def auto_create_budgets_task():
    try:
        logger.info("Auto create budget task started.")
        call_command('auto_create_budgets')
        logger.info("Budget creation command executed successfully.")
    except Exception as e:
        logger.error(f"Error in auto_create_budgets_task: {str(e)}")
        raise
