from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ServiceOrder
from .serializers import ServiceOrderSerializer
from .telegram import notify_async
from .throttles import OrderBurstThrottle, OrderThrottle


class OrderCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [OrderThrottle, OrderBurstThrottle]

    def post(self, request):
        serializer = ServiceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.is_spam():
            # Botga muvaffaqiyat ko'rsatamiz, lekin hech narsa saqlamaymiz
            return Response({"ok": True}, status=status.HTTP_201_CREATED)

        data = {k: v for k, v in serializer.validated_data.items() if k not in ("website", "opened_at")}
        ip = OrderThrottle().get_ident(request)
        order = ServiceOrder.objects.create(**data, ip_hash=ServiceOrderSerializer.hash_ip(ip))
        notify_async(order.pk)
        return Response({"ok": True, "id": str(order.pk)}, status=status.HTTP_201_CREATED)


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        connection.ensure_connection()
        return Response({"status": "ok"})
