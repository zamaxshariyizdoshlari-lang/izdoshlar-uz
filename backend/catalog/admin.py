from django.contrib import admin

from .models import FAQ, AddOn, ComparisonRow, Package, Post, Product, Project, ProjectImage, Testimonial


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "featured", "published", "order")
    list_editable = ("featured", "published", "order")
    list_filter = ("category", "published", "featured")
    search_fields = ("title", "summary")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProjectImageInline]


class OrderedAdmin(admin.ModelAdmin):
    list_editable = ("published", "order")


@admin.register(Package)
class PackageAdmin(OrderedAdmin):
    list_display = ("name", "key", "price_text", "popular", "published", "order")
    list_editable = ("price_text", "popular", "published", "order")


@admin.register(ComparisonRow)
class ComparisonRowAdmin(OrderedAdmin):
    list_display = ("label", "start", "pro", "maktab_biznes", "published", "order")
    list_editable = ("start", "pro", "maktab_biznes", "published", "order")


@admin.register(AddOn)
class AddOnAdmin(OrderedAdmin):
    list_display = ("name", "price_text", "published", "order")
    list_editable = ("price_text", "published", "order")


@admin.register(Testimonial)
class TestimonialAdmin(OrderedAdmin):
    list_display = ("author", "role", "published", "order")


@admin.register(FAQ)
class FAQAdmin(OrderedAdmin):
    list_display = ("question", "scope", "published", "order")
    list_filter = ("scope",)
    list_editable = ("published", "order")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "date", "published")
    list_editable = ("published",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Product)
class ProductAdmin(OrderedAdmin):
    list_display = ("title", "category", "price_text", "published", "order")
    list_editable = ("price_text", "published", "order")
    list_filter = ("category", "published")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
