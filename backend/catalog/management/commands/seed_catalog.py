"""1-bosqichdagi JSON va markdown kontentni bazaga ko'chiradi. Qayta ishga tushirsa ham xavfsiz:
mavjud yozuvlarni yangilamaydi (admin'da qilingan o'zgarishlar saqlanadi), faqat yo'qlarini qo'shadi."""
import json
import re
from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from catalog.models import FAQ, AddOn, ComparisonRow, Package, Post, Project, Testimonial

DEFAULT_DATA = Path(settings.BASE_DIR).parent / "frontend" / "src"


def sym(v):
    return "+" if v is True else "-" if v is False else str(v)


class Command(BaseCommand):
    help = "frontend/src/data va content/blog dan boshlang'ich kontentni bazaga yuklaydi"

    def add_arguments(self, parser):
        parser.add_argument("--source", default=str(DEFAULT_DATA), help="frontend/src papkasi")

    def handle(self, *args, source, **options):
        src = Path(source)
        data = src / "data"
        if not data.is_dir():
            self.stderr.write(f"Topilmadi: {data}")
            return
        load = lambda name: json.loads((data / name).read_text(encoding="utf-8"))  # noqa: E731
        created = 0

        for i, p in enumerate(load("projects.json")):
            _, c = Project.objects.get_or_create(
                slug=p["slug"],
                defaults={k: p[k] for k in ("title", "category", "summary", "problem", "solution", "result", "tech", "featured")}
                | {"placeholder": p.get("placeholder", False), "order": i},
            )
            created += c

        pk = load("packages.json")
        for i, p in enumerate(pk["packages"]):
            _, c = Package.objects.get_or_create(
                key=p["key"],
                defaults={"name": p["name"], "tagline": p["tagline"], "price_text": p["price"], "popular": p["popular"], "features": p["features"], "order": i},
            )
            created += c
        for i, r in enumerate(pk["comparison"]):
            _, c = ComparisonRow.objects.get_or_create(
                label=r["label"],
                defaults=dict(zip(("start", "pro", "maktab_biznes"), map(sym, r["values"]))) | {"order": i},
            )
            created += c
        for i, a in enumerate(pk["addons"]):
            _, c = AddOn.objects.get_or_create(name=a["name"], defaults={"text": a["text"], "price_text": a["price"], "order": i})
            created += c

        for i, f in enumerate(load("faq.json")):
            _, c = FAQ.objects.get_or_create(question=f["q"], defaults={"scope": f["scope"], "answer": f["a"], "order": i})
            created += c

        # Namuna fikrlar saytda ko'rinmasligi uchun yashirin holda qo'shiladi
        for i, t in enumerate(load("testimonials.json")):
            _, c = Testimonial.objects.get_or_create(
                author=t["author"], text=t["text"], defaults={"role": t["role"], "published": not t.get("placeholder", False), "order": i}
            )
            created += c

        for md in sorted((src / "content" / "blog").glob("*.md")):
            m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", md.read_text(encoding="utf-8"), re.S)
            if not m:
                continue
            meta = {}
            for line in m.group(1).splitlines():
                k, _, v = line.partition(":")
                meta[k.strip()] = v.strip().strip("\"'")
            _, c = Post.objects.get_or_create(
                slug=md.stem,
                defaults={"title": meta["title"], "description": meta.get("description", ""), "body": m.group(2).strip(), "date": date.fromisoformat(meta["date"])},
            )
            created += c

        self.stdout.write(self.style.SUCCESS(f"Qo'shildi: {created} ta yozuv"))
