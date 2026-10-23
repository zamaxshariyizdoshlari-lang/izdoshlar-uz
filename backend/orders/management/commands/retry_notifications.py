"""Yuborilmagan buyurtma bildirishnomalarini qayta yuboradi. Cron bilan ishga tushiring:

    */10 * * * * cd /srv/izdoshlar/backend && .venv/bin/python manage.py retry_notifications
"""
import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from orders.models import ServiceOrder
from orders.telegram import send_order_notification


class Command(BaseCommand):
    help = "Hali xabar yuborilmagan buyurtmalar uchun Telegram/email bildirishnomasini qayta urinadi"

    def add_arguments(self, parser):
        parser.add_argument("--hours", type=int, default=72, help="Faqat oxirgi N soatdagi buyurtmalar (standart: 72)")
        parser.add_argument("--pause", type=float, default=1.0, help="Xabarlar orasidagi pauza, soniya")

    def handle(self, *args, hours, pause, **options):
        since = timezone.now() - timedelta(hours=hours)
        pending = list(ServiceOrder.objects.filter(notified_at__isnull=True, created_at__gte=since).order_by("created_at"))
        sent = 0
        for i, order in enumerate(pending):
            if i:
                time.sleep(pause)
            sent += send_order_notification(order.pk)
        self.stdout.write(f"Kutayotgan: {len(pending)}, yuborildi: {sent}")
