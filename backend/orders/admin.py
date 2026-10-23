from django.contrib import admin, messages

from .models import ServiceOrder, StatusChange


class StatusChangeInline(admin.TabularInline):
    model = StatusChange
    extra = 0
    can_delete = False
    readonly_fields = ("from_status", "to_status", "changed_at", "changed_by")

    def has_add_permission(self, request, obj=None):
        return False


def _make_action(status, label):
    def action(modeladmin, request, queryset):
        n = sum(o.change_status(status, request.user) for o in queryset)
        modeladmin.message_user(request, f"{n} ta buyurtma: «{label}»", messages.SUCCESS)

    action.short_description = f"Statusni «{label}» qilish"
    action.__name__ = f"set_{status}"
    return action


@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "name", "phone", "telegram", "service_type", "package", "status", "notified_at")
    list_editable = ("status",)
    list_filter = ("status", "kind", "service_type", "package", "audience")
    search_fields = ("name", "phone", "telegram", "description", "school_name")
    readonly_fields = ("id", "created_at", "status_changed_at", "ip_hash", "consented_at", "notified_at", "notify_error")
    inlines = [StatusChangeInline]
    actions = [_make_action(v, l) for v, l in ServiceOrder.Status.choices]

    def save_model(self, request, obj, form, change):
        # Statusni qoʻlda yoki list_editable orqali oʻzgartirish ham tarixga yoziladi
        if change and "status" in form.changed_data:
            new = obj.status
            obj.status = form.initial.get("status", obj.status)
            super().save_model(request, obj, form, change)
            obj.change_status(new, request.user)
        else:
            super().save_model(request, obj, form, change)
