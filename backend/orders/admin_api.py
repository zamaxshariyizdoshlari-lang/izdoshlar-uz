"""Admin uchun API (token bilan): buyurtmalar ro'yxati va statusni o'zgartirish."""
from rest_framework import mixins, serializers, viewsets
from rest_framework.permissions import IsAdminUser

from .models import ServiceOrder


class AdminOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOrder
        exclude = ["ip_hash"]
        read_only_fields = [f.name for f in ServiceOrder._meta.fields if f.name not in ("status", "admin_note")]


class AdminOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    http_method_names = ["get", "patch", "head", "options"]
    pagination_class = None

    def get_queryset(self):
        qs = ServiceOrder.objects.all()
        status = self.request.query_params.get("status")
        return qs.filter(status=status) if status else qs

    def perform_update(self, serializer):
        new_status = serializer.validated_data.pop("status", None)
        serializer.save()
        if new_status:
            serializer.instance.change_status(new_status, self.request.user)
