import time
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ServiceOrder
from .telegram import send_order_notification

URL = "/api/v1/orders/"

VALID = {
    "name": "Ali Valiyev",
    "phone": "+998901234567",
    "service_type": "website",
    "package": "pro",
    "budget_range": "mid",
    "description": "Maktabimiz uchun sayt kerak.",
    "consent": True,
}


@override_settings(ORDER_MIN_FILL_SECONDS=3)
class OrderEndpointTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        patcher = mock.patch("orders.views.notify_async")
        self.notify = patcher.start()
        self.addCleanup(patcher.stop)

    def test_valid_order_is_saved_and_notified(self):
        resp = self.client.post(URL, VALID, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(ServiceOrder.objects.count(), 1)
        order = ServiceOrder.objects.get()
        self.assertEqual(order.status, "yangi")
        self.assertEqual(len(order.ip_hash), 64)
        self.notify.assert_called_once()

    def test_phone_is_normalized(self):
        data = {**VALID, "phone": "+998 90 123-45-67"}
        self.client.post(URL, data, format="json")
        self.assertEqual(ServiceOrder.objects.get().phone, "+998901234567")

    def test_invalid_phone_rejected(self):
        resp = self.client.post(URL, {**VALID, "phone": "12345"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(ServiceOrder.objects.count(), 0)

    def test_requires_phone_or_telegram(self):
        data = {k: v for k, v in VALID.items() if k != "phone"}
        self.assertEqual(self.client.post(URL, data, format="json").status_code, 400)
        resp = self.client.post(URL, {**data, "telegram": "@ali_dev"}, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_demo_requires_school_name(self):
        demo = {**VALID, "kind": "demo", "service_type": "erp", "description": ""}
        self.assertEqual(self.client.post(URL, demo, format="json").status_code, 400)
        resp = self.client.post(URL, {**demo, "school_name": "12-maktab"}, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_honeypot_silently_dropped(self):
        resp = self.client.post(URL, {**VALID, "website": "http://spam.example"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(ServiceOrder.objects.count(), 0)
        self.notify.assert_not_called()

    def test_too_fast_submission_dropped(self):
        data = {**VALID, "opened_at": int(time.time() * 1000)}
        self.assertEqual(self.client.post(URL, data, format="json").status_code, 201)
        self.assertEqual(ServiceOrder.objects.count(), 0)

    def test_slow_enough_submission_saved(self):
        data = {**VALID, "opened_at": int(time.time() * 1000) - 10_000}
        self.client.post(URL, data, format="json")
        self.assertEqual(ServiceOrder.objects.count(), 1)

    def test_rate_limit(self):
        with override_settings(
            REST_FRAMEWORK={
                **__import__("django.conf").conf.settings.REST_FRAMEWORK,
                "DEFAULT_THROTTLE_RATES": {"orders": "2/hour", "orders_burst": "100/minute"},
            }
        ):
            from .throttles import OrderBurstThrottle, OrderThrottle

            OrderThrottle.THROTTLE_RATES = {"orders": "2/hour", "orders_burst": "100/minute"}
            OrderBurstThrottle.THROTTLE_RATES = OrderThrottle.THROTTLE_RATES
            codes = [self.client.post(URL, VALID, format="json").status_code for _ in range(3)]
        self.assertEqual(codes, [201, 201, 429])

    def test_consent_is_required(self):
        data = {k: v for k, v in VALID.items() if k != "consent"}
        self.assertEqual(self.client.post(URL, data, format="json").status_code, 400)
        self.assertEqual(self.client.post(URL, {**data, "consent": False}, format="json").status_code, 400)
        self.assertEqual(ServiceOrder.objects.count(), 0)

    def test_consent_time_is_stored(self):
        self.client.post(URL, VALID, format="json")
        self.assertIsNotNone(ServiceOrder.objects.get().consented_at)

    def test_health(self):
        self.assertEqual(self.client.get("/api/v1/health/").status_code, 200)

    def test_orders_not_listable_publicly(self):
        self.assertEqual(self.client.get(URL).status_code, 405)


class TelegramTests(TestCase):
    def make_order(self):
        return ServiceOrder.objects.create(name="Ali <b>", phone="+998901234567", service_type="bot")

    @override_settings(TELEGRAM_BOT_TOKEN="", TELEGRAM_CHAT_ID="")
    def test_unconfigured_records_error(self):
        order = self.make_order()
        send_order_notification(order.pk)
        order.refresh_from_db()
        self.assertIsNone(order.notified_at)
        self.assertTrue(order.notify_error)

    @override_settings(TELEGRAM_BOT_TOKEN="SECRET-TOKEN", TELEGRAM_CHAT_ID="1")
    def test_success_marks_notified_and_escapes_html(self):
        order = self.make_order()
        with mock.patch("orders.telegram.requests.post") as post:
            post.return_value.raise_for_status.return_value = None
            send_order_notification(order.pk)
        order.refresh_from_db()
        self.assertIsNotNone(order.notified_at)
        self.assertIn("&lt;b&gt;", post.call_args.kwargs["json"]["text"])

    @override_settings(TELEGRAM_BOT_TOKEN="SECRET-TOKEN", TELEGRAM_CHAT_ID="1")
    def test_failure_does_not_leak_token(self):
        order = self.make_order()
        with mock.patch("orders.telegram.requests.post", side_effect=RuntimeError("boom SECRET-TOKEN")):
            send_order_notification(order.pk)
        order.refresh_from_db()
        self.assertEqual(order.notify_error, "RuntimeError")
        self.assertNotIn("SECRET-TOKEN", order.notify_error)


class NotificationFallbackTests(TestCase):
    def make_order(self):
        return ServiceOrder.objects.create(name="Ali", phone="+998901234567", service_type="bot", description="Test")

    @override_settings(TELEGRAM_BOT_TOKEN="T", TELEGRAM_CHAT_ID="1", ORDER_NOTIFY_EMAIL="me@example.com",
                       EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_fallback_when_telegram_fails(self):
        from django.core import mail

        order = self.make_order()
        with mock.patch("orders.telegram.requests.post", side_effect=ConnectionError("x")):
            self.assertTrue(send_order_notification(order.pk))
        order.refresh_from_db()
        self.assertIsNotNone(order.notified_at)
        self.assertIn("ConnectionError", order.notify_error)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Ali", mail.outbox[0].body)
        self.assertNotIn("<b>", mail.outbox[0].body)

    @override_settings(TELEGRAM_BOT_TOKEN="T", TELEGRAM_CHAT_ID="1", ORDER_NOTIFY_EMAIL="me@example.com",
                       EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_no_email_when_telegram_succeeds(self):
        from django.core import mail

        order = self.make_order()
        with mock.patch("orders.telegram.requests.post") as post:
            post.return_value.raise_for_status.return_value = None
            self.assertTrue(send_order_notification(order.pk))
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(TELEGRAM_BOT_TOKEN="T", TELEGRAM_CHAT_ID="1", ORDER_NOTIFY_EMAIL="")
    def test_both_channels_failing_keeps_order_unnotified(self):
        order = self.make_order()
        with mock.patch("orders.telegram.requests.post", side_effect=ConnectionError("x")):
            self.assertFalse(send_order_notification(order.pk))
        order.refresh_from_db()
        self.assertIsNone(order.notified_at)


class RetryCommandTests(TestCase):
    @override_settings(TELEGRAM_BOT_TOKEN="T", TELEGRAM_CHAT_ID="1")
    def test_retries_only_recent_unnotified_orders(self):
        from datetime import timedelta

        from django.core.management import call_command
        from django.utils import timezone

        fresh = ServiceOrder.objects.create(name="A", phone="+998901234567", service_type="bot")
        done = ServiceOrder.objects.create(name="B", phone="+998901234567", service_type="bot", notified_at=timezone.now())
        old = ServiceOrder.objects.create(name="C", phone="+998901234567", service_type="bot")
        ServiceOrder.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=10))
        with mock.patch("orders.telegram.requests.post") as post:
            post.return_value.raise_for_status.return_value = None
            call_command("retry_notifications", pause=0, verbosity=0)
        self.assertEqual(post.call_count, 1)
        fresh.refresh_from_db(), done.refresh_from_db(), old.refresh_from_db()
        self.assertIsNotNone(fresh.notified_at)
        self.assertIsNone(old.notified_at)
