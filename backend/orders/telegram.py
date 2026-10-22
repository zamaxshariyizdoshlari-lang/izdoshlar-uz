import logging
import threading

import requests
from django.conf import settings
from django.utils import timezone

from .models import ServiceOrder

logger = logging.getLogger(__name__)


def _esc(value):
    """Telegram HTML parse_mode uchun xavfsiz matn."""
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def format_message(order):
    title = "🆕 Demo so'rovi" if order.kind == ServiceOrder.Kind.DEMO else "🆕 Yangi buyurtma"
    lines = [f"<b>{title}</b>", f"👤 {_esc(order.name)}"]
    if order.phone:
        lines.append(f"📞 {_esc(order.phone)}")
    if order.telegram:
        lines.append(f"✈️ {_esc(order.telegram)}")
    lines.append(f"🛠 {_esc(order.get_service_type_display())} · {_esc(order.get_package_display())}")
    lines.append(f"💰 Byudjet: {_esc(order.get_budget_range_display())}")
    if order.school_name:
        lines.append(f"🏫 {_esc(order.school_name)}, o'quvchilar: {order.student_count or '—'}")
    if order.current_system:
        lines.append(f"🖥 Hozirgi tizim: {_esc(order.current_system)}")
    if order.description:
        lines.append(f"\n{_esc(order.description[:700])}")
    if order.file_url:
        lines.append(f"🔗 {_esc(order.file_url)}")
    return "\n".join(lines)


def send_order_notification(order_id):
    """Telegramga xabar yuboradi. Natija buyurtmada saqlanadi; xato buyurtmani buzmaydi."""
    token, chat_id = settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID
    try:
        order = ServiceOrder.objects.get(pk=order_id)
    except ServiceOrder.DoesNotExist:
        return
    if not token or not chat_id:
        order.notify_error = "Telegram sozlanmagan"
        order.save(update_fields=["notify_error"])
        return
    try:
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": format_message(order),
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
            timeout=8,
        )
        resp.raise_for_status()
        order.notified_at = timezone.now()
        order.notify_error = ""
    except Exception as exc:  # noqa: BLE001 - tarmoq xatosi buyurtmani yo'qotmasligi kerak
        # Xato matnida bot token (URL ichida) bo'lishi mumkin, shuning uchun faqat tur nomi saqlanadi
        order.notify_error = type(exc).__name__
        logger.warning("Telegram xabari yuborilmadi: %s", type(exc).__name__)
    order.save(update_fields=["notified_at", "notify_error"])


def notify_async(order_id):
    threading.Thread(target=send_order_notification, args=(str(order_id),), daemon=True).start()
