from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Izdoshlar boshqaruvi"
admin.site.site_title = "Izdoshlar"
admin.site.index_title = "Buyurtmalar va kontent"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("orders.urls")),
    path("api/v1/", include("catalog.urls")),
]

# Ishlab chiqarishda /media/ ni nginx beradi (READMEʼga qarang)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
