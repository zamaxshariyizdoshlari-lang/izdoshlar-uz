from unittest import mock

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import FAQ, ComparisonRow, Package, Post, Project, Testimonial


def make_project(**kw):
    base = dict(slug="p1", title="P1", category="sayt", summary="s", problem="a", solution="b", result="c")
    return Project.objects.create(**{**base, **kw})


class PublicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_only_published_projects_and_category_filter(self):
        make_project(slug="a", category="erp")
        make_project(slug="b", category="sayt")
        make_project(slug="c", category="erp", published=False)
        data = self.client.get("/api/v1/projects/").json()
        self.assertEqual({p["slug"] for p in data}, {"a", "b"})
        erp = self.client.get("/api/v1/projects/?category=erp").json()
        self.assertEqual([p["slug"] for p in erp], ["a"])

    def test_project_detail_by_slug_and_unpublished_404(self):
        make_project(slug="a", tech=["React"])
        make_project(slug="hidden", published=False)
        self.assertEqual(self.client.get("/api/v1/projects/a/").json()["tech"], ["React"])
        self.assertEqual(self.client.get("/api/v1/projects/hidden/").status_code, 404)

    def test_ordering_by_order_field(self):
        make_project(slug="late", order=5)
        make_project(slug="early", order=1)
        self.assertEqual([p["slug"] for p in self.client.get("/api/v1/projects/").json()], ["early", "late"])

    def test_packages_use_price_field_name_frontend_expects(self):
        Package.objects.create(key="pro", name="Pro", price_text="1 000 000", features=["x"])
        self.assertEqual(self.client.get("/api/v1/packages/").json()[0]["price"], "1 000 000")

    def test_comparison_symbols_become_booleans_and_text(self):
        ComparisonRow.objects.create(label="L", start="-", pro="+", maktab_biznes="6 oy")
        self.assertEqual(self.client.get("/api/v1/comparison/").json()[0]["values"], [False, True, "6 oy"])

    def test_faq_scope_filter_and_field_names(self):
        FAQ.objects.create(scope="home", question="Q1", answer="A1")
        FAQ.objects.create(scope="pricing", question="Q2", answer="A2")
        data = self.client.get("/api/v1/faq/?scope=pricing").json()
        self.assertEqual(data, [{"scope": "pricing", "q": "Q2", "a": "A2"}])

    def test_unpublished_testimonial_hidden(self):
        Testimonial.objects.create(author="A", text="t", published=False)
        self.assertEqual(self.client.get("/api/v1/testimonials/").json(), [])

    def test_posts(self):
        Post.objects.create(slug="x", title="T", description="d", body="# hi", date="2026-01-01")
        self.assertEqual(self.client.get("/api/v1/posts/x/").json()["body"], "# hi")

    def test_public_api_is_read_only(self):
        self.assertEqual(self.client.post("/api/v1/projects/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.delete("/api/v1/faq/1/").status_code, 405)


class SeedTests(TestCase):
    def test_seed_is_idempotent_and_keeps_admin_edits(self):
        call_command("seed_catalog", verbosity=0)
        count = Project.objects.count()
        self.assertGreater(count, 0)
        self.assertGreater(Post.objects.count(), 0)
        # Namuna fikrlar yashirin
        self.assertFalse(Testimonial.objects.filter(published=True).exists())
        p = Project.objects.first()
        p.title = "Admin o'zgartirdi"
        p.save()
        call_command("seed_catalog", verbosity=0)
        self.assertEqual(Project.objects.count(), count)
        p.refresh_from_db()
        self.assertEqual(p.title, "Admin o'zgartirdi")


@override_settings(FRONTEND_DEPLOY_HOOK_URL="https://hook.example/secret", DEPLOY_HOOK_DEBOUNCE_SECONDS=0)
class DeployHookTests(TestCase):
    def test_saving_content_triggers_rebuild(self):
        with mock.patch("catalog.signals.threading.Timer") as timer:
            make_project()
        timer.assert_called_once()

    @override_settings(FRONTEND_DEPLOY_HOOK_URL="")
    def test_no_hook_configured_does_nothing(self):
        with mock.patch("catalog.signals.threading.Timer") as timer:
            make_project(slug="zz")
        timer.assert_not_called()
