from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import ServiceOrder, StatusChange


class AdminOrderApiTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.admin = User.objects.create_user("boss", password="pw-12345-xyz", is_staff=True)
        self.user = User.objects.create_user("user", password="pw-12345-xyz")
        self.order = ServiceOrder.objects.create(name="Ali", phone="+998901234567", service_type="bot")
        self.client = APIClient()

    def auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_anonymous_cannot_list(self):
        self.assertEqual(self.client.get("/api/v1/admin/orders/").status_code, 401)

    def test_non_staff_forbidden(self):
        self.auth(self.user)
        self.assertEqual(self.client.get("/api/v1/admin/orders/").status_code, 403)

    def test_token_login(self):
        resp = self.client.post("/api/v1/auth/token/", {"username": "boss", "password": "pw-12345-xyz"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("token", resp.json())

    def test_logout_deletes_token(self):
        self.auth(self.admin)
        self.assertEqual(self.client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertFalse(Token.objects.filter(user=self.admin).exists())
        self.assertEqual(self.client.get("/api/v1/admin/orders/").status_code, 401)

    def test_list_hides_ip_hash_and_filters_by_status(self):
        self.auth(self.admin)
        data = self.client.get("/api/v1/admin/orders/").json()
        self.assertEqual(len(data), 1)
        self.assertNotIn("ip_hash", data[0])
        self.assertEqual(self.client.get("/api/v1/admin/orders/?status=tugadi").json(), [])

    def test_patch_status_logs_history(self):
        self.auth(self.admin)
        resp = self.client.patch(f"/api/v1/admin/orders/{self.order.pk}/", {"status": "muzokara"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "muzokara")
        self.assertIsNotNone(self.order.status_changed_at)
        log = StatusChange.objects.get()
        self.assertEqual((log.from_status, log.to_status, log.changed_by), ("yangi", "muzokara", self.admin))

    def test_invalid_status_rejected(self):
        self.auth(self.admin)
        resp = self.client.patch(f"/api/v1/admin/orders/{self.order.pk}/", {"status": "bekor"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_only_status_and_note_are_editable(self):
        self.auth(self.admin)
        self.client.patch(f"/api/v1/admin/orders/{self.order.pk}/", {"name": "Hack", "admin_note": "narx 5 mln"}, format="json")
        self.order.refresh_from_db()
        self.assertEqual(self.order.name, "Ali")
        self.assertEqual(self.order.admin_note, "narx 5 mln")

    def test_delete_not_allowed(self):
        self.auth(self.admin)
        self.assertEqual(self.client.delete(f"/api/v1/admin/orders/{self.order.pk}/").status_code, 405)

    def test_same_status_does_not_create_history(self):
        self.auth(self.admin)
        self.client.patch(f"/api/v1/admin/orders/{self.order.pk}/", {"status": "yangi"}, format="json")
        self.assertEqual(StatusChange.objects.count(), 0)


class DjangoAdminStatusTests(TestCase):
    def setUp(self):
        self.su = get_user_model().objects.create_superuser("root", "r@example.com", "pw-12345-xyz")
        self.order = ServiceOrder.objects.create(name="Ali", phone="+998901234567", service_type="bot")
        self.client.force_login(self.su)

    def test_bulk_action_changes_status_and_logs(self):
        resp = self.client.post(
            "/admin/orders/serviceorder/",
            {"action": "set_jarayonda", "_selected_action": [str(self.order.pk)]},
        )
        self.assertEqual(resp.status_code, 302)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "jarayonda")
        self.assertEqual(StatusChange.objects.get().changed_by, self.su)

    def test_save_model_logs_status_edit(self):
        from types import SimpleNamespace

        from django.contrib import admin as dj_admin

        ma = dj_admin.site._registry[ServiceOrder]
        self.order.status = "tugadi"
        form = SimpleNamespace(changed_data=["status"], initial={"status": "yangi"})
        ma.save_model(SimpleNamespace(user=self.su), self.order, form, True)
        log = StatusChange.objects.get()
        self.assertEqual((log.from_status, log.to_status), ("yangi", "tugadi"))
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "tugadi")
