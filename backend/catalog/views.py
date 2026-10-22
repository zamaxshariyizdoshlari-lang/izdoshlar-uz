from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from . import serializers as s
from .models import FAQ, AddOn, ComparisonRow, Package, Post, Project, Testimonial


class PublicReadOnly(viewsets.ReadOnlyModelViewSet):
    """Ochiq, faqat o'qish; `published=True` yozuvlar qaytariladi, sahifalash yo'q."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    pagination_class = None
    model = None

    def get_queryset(self):
        return self.model.objects.filter(published=True)


class ProjectViewSet(PublicReadOnly):
    model = Project
    serializer_class = s.ProjectSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("images")
        category = self.request.query_params.get("category")
        return qs.filter(category=category) if category else qs


class PackageViewSet(PublicReadOnly):
    model = Package
    serializer_class = s.PackageSerializer


class ComparisonViewSet(PublicReadOnly):
    model = ComparisonRow
    serializer_class = s.ComparisonRowSerializer


class AddOnViewSet(PublicReadOnly):
    model = AddOn
    serializer_class = s.AddOnSerializer


class TestimonialViewSet(PublicReadOnly):
    model = Testimonial
    serializer_class = s.TestimonialSerializer


class FAQViewSet(PublicReadOnly):
    model = FAQ
    serializer_class = s.FAQSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        scope = self.request.query_params.get("scope")
        return qs.filter(scope=scope) if scope else qs


class PostViewSet(PublicReadOnly):
    model = Post
    serializer_class = s.PostSerializer
    lookup_field = "slug"
