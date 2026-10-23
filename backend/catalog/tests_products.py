import io
import shutil
import tempfile
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Product

TMP_MEDIA = tempfile.mkdtemp(prefix="izd-media-")


def png(size=(8, 8), name="a.png"):
    buf = io.BytesIO()
    Image.new("RGB", size, "orange").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=TMP_MEDIA)
class ProductApiTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TMP_MEDIA, ignore_errors=True)

    def setUp(self):
        User = get_user_model()
        self.staff = User.objects.create_user("boss", password="pw-12345-xyz", is_staff=True)
        self.plain = User.objects.create_user("user", password="pw-12345-xyz")
        self.client = APIClient()

    def auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    # ---- ochiq katalog ----
    def test_public_lists_only_published_and_filters_category(self):
        Product.objects.create(title="A", category="taqdimot", price_text="10 000")
        Product.objects.create(title="B", category="video")
        Product.objects.create(title="Yashirin", published=False)
        data = self.client.get("/api/v1/products/").json()
        self.assertEqual({p["title"] for p in data}, {"A", "B"})
        self.assertEqual(data[0]["price"], "10 000")
        only = self.client.get("/api/v1/products/?category=video").json()
        self.assertEqual([p["title"] for p in only], ["B"])

    def test_public_detail_and_hidden_404(self):
        p = Product.objects.create(title="Dars taqdimoti")
        Product.objects.create(title="Yashirin", published=False, slug="yashirin")
        self.assertEqual(self.client.get(f"/api/v1/products/{p.slug}/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/products/yashirin/").status_code, 404)

    def test_public_api_is_read_only(self):
        self.assertEqual(self.client.post("/api/v1/products/", {"title": "x"}, format="json").status_code, 405)

    # ---- slug ----
    def test_slug_generated_and_unique(self):
        a = Product.objects.create(title="Oʻqituvchi uchun taqdimot")
        b = Product.objects.create(title="Oʻqituvchi uchun taqdimot")
        self.assertEqual(a.slug, "oqituvchi-uchun-taqdimot")
        self.assertEqual(b.slug, "oqituvchi-uchun-taqdimot-2")

    # ---- admin API: huquqlar ----
    def test_admin_api_requires_staff(self):
        self.assertEqual(self.client.get("/api/v1/admin/products/").status_code, 401)
        self.auth(self.plain)
        self.assertEqual(self.client.get("/api/v1/admin/products/").status_code, 403)
        self.assertEqual(self.client.post("/api/v1/admin/products/", {"title": "x"}, format="json").status_code, 403)

    # ---- admin API: CRUD ----
    def test_staff_sees_hidden_products(self):
        Product.objects.create(title="Yashirin", published=False)
        self.auth(self.staff)
        data = self.client.get("/api/v1/admin/products/").json()
        self.assertEqual(len(data), 1)
        self.assertFalse(data[0]["published"])

    def test_create_with_json(self):
        self.auth(self.staff)
        resp = self.client.post(
            "/api/v1/admin/products/",
            {"title": "Fizika testlari", "category": "shablon", "price": "30 000", "description": "50 ta savol"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        p = Product.objects.get()
        self.assertEqual((p.slug, p.price_text, p.category), ("fizika-testlari", "30 000", "shablon"))

    def test_create_with_image_multipart(self):
        self.auth(self.staff)
        resp = self.client.post("/api/v1/admin/products/", {"title": "Rasmli", "cover": png()}, format="multipart")
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(Product.objects.get().cover.name.startswith("products/"))
        self.assertIn("/media/products/", resp.json()["cover"])

    def test_rejects_non_image_upload(self):
        self.auth(self.staff)
        bad = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")
        resp = self.client.post("/api/v1/admin/products/", {"title": "Yomon", "cover": bad}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Product.objects.count(), 0)

    def test_rejects_oversized_image(self):
        self.auth(self.staff)
        with mock.patch("catalog.serializers.MAX_IMAGE_BYTES", 10):
            resp = self.client.post("/api/v1/admin/products/", {"title": "Katta", "cover": png()}, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("5 MB", str(resp.json()["cover"]))
        self.assertEqual(Product.objects.count(), 0)

    def test_requires_title(self):
        self.auth(self.staff)
        self.assertEqual(self.client.post("/api/v1/admin/products/", {"title": " "}, format="json").status_code, 400)

    def test_patch_hide_and_slug_is_readonly(self):
        p = Product.objects.create(title="Mahsulot")
        self.auth(self.staff)
        resp = self.client.patch(f"/api/v1/admin/products/{p.pk}/", {"published": False, "slug": "hack"}, format="json")
        self.assertEqual(resp.status_code, 200)
        p.refresh_from_db()
        self.assertFalse(p.published)
        self.assertEqual(p.slug, "mahsulot")

    def test_remove_cover(self):
        self.auth(self.staff)
        created = self.client.post("/api/v1/admin/products/", {"title": "Rasmli", "cover": png()}, format="multipart").json()
        p = Product.objects.get(pk=created["id"])
        path = p.cover.path
        resp = self.client.patch(f"/api/v1/admin/products/{p.pk}/", {"remove_cover": True}, format="json")
        self.assertEqual(resp.status_code, 200)
        p.refresh_from_db()
        self.assertFalse(p.cover)
        import os

        self.assertFalse(os.path.exists(path))

    def test_delete_removes_product_and_file(self):
        self.auth(self.staff)
        created = self.client.post("/api/v1/admin/products/", {"title": "Oʻchadi", "cover": png()}, format="multipart").json()
        p = Product.objects.get(pk=created["id"])
        path = p.cover.path
        self.assertEqual(self.client.delete(f"/api/v1/admin/products/{p.pk}/").status_code, 204)
        self.assertEqual(Product.objects.count(), 0)
        import os

        self.assertFalse(os.path.exists(path))
