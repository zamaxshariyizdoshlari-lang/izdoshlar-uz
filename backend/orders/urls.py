from django.urls import path
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.routers import SimpleRouter
from rest_framework.throttling import AnonRateThrottle

from .admin_api import AdminOrderViewSet
from .views import HealthView, OrderCreateView


class LoginThrottle(AnonRateThrottle):
    scope = "login"


class ThrottledObtainToken(obtain_auth_token.cls):
    throttle_classes = [LoginThrottle]


class LogoutView(APIView):
    """Tokenni o'chiradi (shu foydalanuvchining barcha qurilmalaridagi sessiya tugaydi)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=204)


router = SimpleRouter()
router.register("admin/orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = [
    path("orders/", OrderCreateView.as_view(), name="order-create"),
    path("health/", HealthView.as_view(), name="health"),
    path("auth/token/", ThrottledObtainToken.as_view(), name="auth-token"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
] + router.urls
