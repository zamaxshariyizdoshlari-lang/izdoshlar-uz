from rest_framework import serializers

from .models import FAQ, AddOn, ComparisonRow, Package, Post, Product, Project, Testimonial


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


class ProductSerializer(serializers.ModelSerializer):
    """Ochiq katalog uchun."""

    price = serializers.CharField(source="price_text")
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["slug", "title", "description", "category", "price", "cover"]

    def get_cover(self, obj):
        request = self.context.get("request")
        if not obj.cover:
            return ""
        return request.build_absolute_uri(obj.cover.url) if request else obj.cover.url


MAX_IMAGE_BYTES = 5 * 1024 * 1024


class AdminProductSerializer(serializers.ModelSerializer):
    """Boshqaruv paneli uchun: barcha maydonlar, rasm yuklash (multipart)."""

    price = serializers.CharField(source="price_text", required=False, allow_blank=True, max_length=60)
    cover = serializers.ImageField(required=False, allow_null=True)
    remove_cover = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Product
        fields = ["id", "slug", "title", "description", "category", "price", "cover", "remove_cover", "published", "order"]
        read_only_fields = ["id", "slug"]

    def validate_cover(self, value):
        if value and value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Rasm hajmi 5 MB dan oshmasligi kerak.")
        return value

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Nomini kiriting.")
        return value

    def update(self, instance, validated_data):
        remove = validated_data.pop("remove_cover", False)
        if remove and not validated_data.get("cover") and instance.cover:
            instance.cover.delete(save=False)
            instance.cover = ""
        return super().update(instance, validated_data)

    def create(self, validated_data):
        validated_data.pop("remove_cover", None)
        return super().create(validated_data)
