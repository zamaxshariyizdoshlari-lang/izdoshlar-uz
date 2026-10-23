import logging
import threading

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import ServiceOrder

logger = logging.getLogger(__name__)


class NotConfigured(Exception):
    """Telegram sozlamalari yoʻq (token yoki chat id boʻsh)."""


def _esc(value):
    """Telegram HTML parse_mode uchun xavfsiz matn."""
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def format_message(order):
    title = "🆕 Demo soʻrovi" if order.kind == ServiceOrder.Kind.DEMO else "🆕 Yangi buyurtma"
    lines = [f"<b>{title}</b>", f"👤 {_esc(order.name)}"]
    if order.phone:
        lines.append(f"📞 {_esc(order.phone)}")
    if order.telegram:
        lines.append(f"✈️ {_esc(order.telegram)}")
    lines.append(f"🛠 {_esc(order.get_service_type_display())} · {_esc(order.get_package_display())}")
    lines.append(f"💰 Byudjet: {_esc(order.get_budget_range_display())}")
    if order.school_name:
        lines.append(f"🏫 {_esc(order.school_name)}, oʻquvchilar: {order.student_count or '—'}")
    if order.current_system:
        lines.append(f"🖥 Hozirgi tizim: {_esc(order.current_system)}")
    if order.description:
        lines.append(f"\n{_esc(order.description[:700])}")
    if order.file_url:
        lines.append(f"🔗 {_esc(order.file_url)}")
    return "\n".join(lines)


def _plain(order):
    """Email uchun oddiy matn (HTML belgilarisiz)."""
    text = format_message(order).replace("<b>", "").replace("</b>", "")
    return text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")


def _send_telegram(order):
    token, chat_id = settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        raise NotConfigured
    resp = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": format_message(order), "parse_mode": "HTML", "disable_web_page_preview": True},
        timeout=8,
    )
    resp.raise_for_status()


def _send_email(order):
    send_mail(
        subject=f"Yangi {order.get_kind_display().lower()}: {order.name}",
        message=_plain(order),
        from_email=None,
        recipient_list=[settings.ORDER_NOTIFY_EMAIL],
        fail_silently=False,
    )


def send_order_notification(order_id):
    """Telegramga yuboradi; ishlamasa zaxira sifatida emailga. Natija buyurtmada saqlanadi.

    `notified_at` ikkala kanaldan biri muvaffaqiyatli boʻlsa qoʻyiladi. Telegram xatosi
    (faqat xato turi, token sizib chiqmasligi uchun) `notify_error` da qoladi.
    Xato buyurtmani hech qachon buzmaydi. Yuborilgan boʻlsa True qaytaradi.
    """
    try:
        order = ServiceOrder.objects.get(pk=order_id)
    except ServiceOrder.DoesNotExist:
        return False

    sent = False
    error = ""
    try:
        _send_telegram(order)
        sent = True
    except Exception as exc:  # noqa: BLE001 - tarmoq xatosi buyurtmani yoʻqotmasligi kerak
        error = "Telegram sozlanmagan" if isinstance(exc, NotConfigured) else type(exc).__name__
        logger.warning("Telegram xabari yuborilmadi: %s", error)

    if not sent and settings.ORDER_NOTIFY_EMAIL:
        try:
            _send_email(order)
            sent = True
            error = f"{error} (email yuborildi)"
        except Exception as exc:  # noqa: BLE001
            error = f"{error}; email: {type(exc).__name__}"
            logger.warning("Email yuborilmadi: %s", type(exc).__name__)

    order.notified_at = timezone.now() if sent else None
    order.notify_error = "" if sent and not error else error[:300]
    order.save(update_fields=["notified_at", "notify_error"])
    return sent


def notify_async(order_id):
    threading.Thread(target=send_order_notification, args=(str(order_id),), daemon=True).start()
