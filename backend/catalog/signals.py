"""Kontent o'zgarganda frontend qayta build qilinadi (Vercel/Netlify deploy hook).

Sahifalar build vaqtida statik HTML ga aylantirilgani uchun (SEO), admin'da
o'zgartirish saytda ko'rinishi uchun qayta build kerak. Ketma-ket saqlashlar
bitta build'ga birlashtiriladi (debounce).
"""
import logging
import threading

import requests
from django.conf import settings
from django.db.models.signals import post_delete, post_save

from .models import FAQ, AddOn, ComparisonRow, Package, Post, Project, ProjectImage, Testimonial

logger = logging.getLogger(__name__)
_timer = None
_lock = threading.Lock()


def _fire():
    try:
        requests.post(settings.FRONTEND_DEPLOY_HOOK_URL, timeout=10).raise_for_status()
    except Exception as exc:  # noqa: BLE001 - hook xatosi admin'ni to'xtatmasligi kerak
        # URL ichida maxfiy kalit bor, shuning uchun faqat xato turi yoziladi
        logger.warning("Deploy hook ishlamadi: %s", type(exc).__name__)


def schedule_rebuild(**_kwargs):
    global _timer
    if not settings.FRONTEND_DEPLOY_HOOK_URL:
        return
    with _lock:
        if _timer:
            _timer.cancel()
        _timer = threading.Timer(settings.DEPLOY_HOOK_DEBOUNCE_SECONDS, _fire)
        _timer.daemon = True
        _timer.start()


def connect():
    for model in (Project, ProjectImage, Package, ComparisonRow, AddOn, Testimonial, FAQ, Post):
        post_save.connect(schedule_rebuild, sender=model, dispatch_uid=f"rebuild-save-{model.__name__}")
        post_delete.connect(schedule_rebuild, sender=model, dispatch_uid=f"rebuild-del-{model.__name__}")
