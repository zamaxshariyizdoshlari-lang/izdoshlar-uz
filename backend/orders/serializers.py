import hashlib
import re
import time

from django.conf import settings
from rest_framework import serializers

from .models import ServiceOrder

PHONE_RE = re.compile(r"^\+998\d{9}$")
TG_RE = re.compile(r"^@?[A-Za-z][A-Za-z0-9_]{4,31}$")


class ServiceOrderSerializer(serializers.ModelSerializer):
    # Spamdan himoya: odam ko'rmaydigan maydon va forma ochilgan vaqt (ms)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    opened_at = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = ServiceOrder
        fields = [
            "id", "kind", "name", "phone", "telegram", "audience", "service_type",
            "package", "budget_range", "description", "file_url",
            "school_name", "student_count", "current_system", "source_page",
            "website", "opened_at",
        ]
        read_only_fields = ["id"]

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Ismingizni kiriting.")
        return value

    def validate_phone(self, value):
        value = re.sub(r"[\s\-()]", "", value or "")
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError("Telefon raqami +998901234567 ko'rinishida bo'lishi kerak.")
        return value

    def validate_telegram(self, value):
        value = (value or "").strip()
        if value and not TG_RE.match(value):
            raise serializers.ValidationError("Telegram username noto'g'ri (masalan, @username).")
        return value

    def validate_file_url(self, value):
        if value and not value.lower().startswith(("http://", "https://")):
            raise serializers.ValidationError("Havola http(s):// bilan boshlanishi kerak.")
        return value

    def validate(self, attrs):
        if not attrs.get("phone") and not attrs.get("telegram"):
            raise serializers.ValidationError("Telefon yoki Telegram'dan kamida bittasini kiriting.")
        if attrs.get("kind") == ServiceOrder.Kind.DEMO:
            if not attrs.get("school_name"):
                raise serializers.ValidationError({"school_name": "Maktab nomini kiriting."})
        elif len(attrs.get("description", "").strip()) < 10:
            raise serializers.ValidationError({"description": "Iltimos, loyihani qisqacha tavsiflang."})
        return attrs

    def is_spam(self):
        data = self.validated_data
        if data.get("website"):
            return True
        opened = data.get("opened_at")
        if opened is not None and (time.time() * 1000 - opened) < settings.ORDER_MIN_FILL_SECONDS * 1000:
            return True
        return False

    @staticmethod
    def hash_ip(ip):
        return hashlib.sha256(f"{settings.SECRET_KEY}:{ip}".encode()).hexdigest()
