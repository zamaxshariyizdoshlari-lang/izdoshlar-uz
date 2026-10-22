from rest_framework import serializers

from .models import FAQ, AddOn, ComparisonRow, Package, Post, Project, Testimonial


class ProjectSerializer(serializers.ModelSerializer):
    cover = serializers.SerializerMethodField()
    screenshots = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["slug", "title", "category", "summary", "problem", "solution", "result",
                  "tech", "cover", "screenshots", "featured", "placeholder"]

    def _url(self, f):
        request = self.context.get("request")
        return request.build_absolute_uri(f.url) if f and request else (f.url if f else "")

    def get_cover(self, obj):
        return self._url(obj.cover) if obj.cover else ""

    def get_screenshots(self, obj):
        return [self._url(i.image) for i in obj.images.all()]


class PackageSerializer(serializers.ModelSerializer):
    price = serializers.CharField(source="price_text")

    class Meta:
        model = Package
        fields = ["key", "name", "tagline", "price", "popular", "features"]


class ComparisonRowSerializer(serializers.ModelSerializer):
    values = serializers.ListField(read_only=True)

    class Meta:
        model = ComparisonRow
        fields = ["label", "values"]


class AddOnSerializer(serializers.ModelSerializer):
    price = serializers.CharField(source="price_text")

    class Meta:
        model = AddOn
        fields = ["name", "text", "price"]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["author", "role", "text"]


class FAQSerializer(serializers.ModelSerializer):
    q = serializers.CharField(source="question")
    a = serializers.CharField(source="answer")

    class Meta:
        model = FAQ
        fields = ["scope", "q", "a"]


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["slug", "title", "description", "body", "date"]
