import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class ServiceOrder(models.Model):
    class Kind(models.TextChoices):
        ORDER = "order", "Buyurtma"
        DEMO = "demo", "Demo soʻrovi"

    class Audience(models.TextChoices):
        SCHOOL = "school", "Maktab"
        BUSINESS = "business", "Biznes"

    class ServiceType(models.TextChoices):
        WEBSITE = "website", "Sayt / veb-ilova"
        ERP = "erp", "Maktab ERP"
        TIMETABLE = "timetable", "Dars jadvali"
        BOT = "bot", "Telegram / Instagram bot"
        AI = "ai", "AI agent / yordamchi"
        CONTENT = "content", "Taqdimot / kontent"
        OTHER = "other", "Boshqa"

    class Package(models.TextChoices):
        START = "start", "Start"
        PRO = "pro", "Pro"
        MAKTAB_BIZNES = "maktab_biznes", "Maktab-Biznes"
        CUSTOM = "custom", "Maxsus / bilmayman"

    class Budget(models.TextChoices):
        UNKNOWN = "unknown", "Aniq emas"
        LOW = "low", "Kam"
        MID = "mid", "Oʻrta"
        HIGH = "high", "Yuqori"
        TALK = "talk", "Kelishamiz"

    class Status(models.TextChoices):
        NEW = "yangi", "Yangi"
        NEGOTIATION = "muzokara", "Muzokara"
        IN_PROGRESS = "jarayonda", "Jarayonda"
        DONE = "tugadi", "Tugadi"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.ORDER)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW)
    status_changed_at = models.DateTimeField(null=True, blank=True, editable=False)
    admin_note = models.TextField("Ichki izoh", blank=True, help_text="Faqat sizga koʻrinadi: narx, kelishuv va hokazo")

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    telegram = models.CharField(max_length=33, blank=True)

    audience = models.CharField(max_length=10, choices=Audience.choices, default=Audience.BUSINESS)
    service_type = models.CharField(max_length=12, choices=ServiceType.choices)
    package = models.CharField(max_length=14, choices=Package.choices, default=Package.CUSTOM)
    budget_range = models.CharField(max_length=10, choices=Budget.choices, default=Budget.UNKNOWN)
    description = models.TextField(max_length=3000, blank=True)
    file_url = models.URLField(max_length=500, blank=True)

    # Faqat demo soʻrovi uchun
    school_name = models.CharField(max_length=150, blank=True)
    student_count = models.PositiveIntegerField(null=True, blank=True)
    current_system = models.CharField(max_length=150, blank=True)

    source_page = models.CharField(max_length=200, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)

    consented_at = models.DateTimeField("Rozilik vaqti", null=True, blank=True, editable=False)
    notified_at = models.DateTimeField(null=True, blank=True)
    notify_error = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Buyurtma"
        verbose_name_plural = "Buyurtmalar"

    def __str__(self):
        return f"{self.get_kind_display()}: {self.name} ({self.created_at:%Y-%m-%d})"

    def change_status(self, new_status, user=None):
        """Statusni oʻzgartiradi va tarixga yozadi. Oʻzgarish boʻlmasa False qaytaradi."""
        if new_status == self.status:
            return False
        old = self.status
        self.status = new_status
        self.status_changed_at = timezone.now()
        self.save(update_fields=["status", "status_changed_at"])
        StatusChange.objects.create(order=self, from_status=old, to_status=new_status, changed_by=user)
        return True


class StatusChange(models.Model):
    order = models.ForeignKey(ServiceOrder, related_name="history", on_delete=models.CASCADE)
    from_status = models.CharField(max_length=12, choices=ServiceOrder.Status.choices)
    to_status = models.CharField(max_length=12, choices=ServiceOrder.Status.choices)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-changed_at"]
        verbose_name = "Status oʻzgarishi"
        verbose_name_plural = "Status tarixi"
