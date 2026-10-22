from rest_framework.throttling import AnonRateThrottle


class OrderThrottle(AnonRateThrottle):
    scope = "orders"


class OrderBurstThrottle(AnonRateThrottle):
    scope = "orders_burst"
