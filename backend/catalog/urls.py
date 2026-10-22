from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("projects", views.ProjectViewSet, basename="project")
router.register("packages", views.PackageViewSet, basename="package")
router.register("comparison", views.ComparisonViewSet, basename="comparison")
router.register("addons", views.AddOnViewSet, basename="addon")
router.register("testimonials", views.TestimonialViewSet, basename="testimonial")
router.register("faq", views.FAQViewSet, basename="faq")
router.register("posts", views.PostViewSet, basename="post")

urlpatterns = router.urls
