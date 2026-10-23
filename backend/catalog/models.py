from django.db import models


class Publishable(models.Model):
    published = models.BooleanField("Saytda koʻrsatish", default=True)
    order = models.PositiveIntegerField("Tartib", default=0, help_text="Kichik raqam yuqorida turadi")

    class Meta:
        abstract = True
        ordering = ["order", "id"]


class Project(Publishable):
    class Category(models.TextChoices):
        SAYT = "sayt", "Sayt"
        ERP = "erp", "ERP"
        AI_BOT = "ai-bot", "AI / Bot"
        KONTENT = "kontent", "Kontent"

    slug = models.SlugField("URL manzil", unique=True)
    title = models.CharField("Nomi", max_length=150)
    category = models.CharField("Toifa", max_length=10, choices=Category.choices)
    summary = models.CharField("Qisqa tavsif", max_length=300)
    problem = models.TextField("Muammo")
    solution = models.TextField("Yechim")
    result = models.TextField("Natija")
    tech = models.JSONField("Texnologiyalar", default=list, blank=True, help_text='Ro\'yxat: ["React", "Django"]')
    cover = models.ImageField("Muqova rasmi", upload_to="projects/", blank=True)
    featured = models.BooleanField("Bosh sahifada koʻrsatish", default=False)
    placeholder = models.BooleanField("Namuna matn", default=False)

    class Meta(Publishable.Meta):
        verbose_name = "Loyiha"
        verbose_name_plural = "Loyihalar"

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField("Rasm", upload_to="projects/")
    caption = models.CharField("Izoh", max_length=150, blank=True)
    order = models.PositiveIntegerField("Tartib", default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Rasm"
        verbose_name_plural = "Rasmlar"


class Package(Publishable):
    key = models.SlugField("Kalit", unique=True, help_text="start, pro, maktab_biznes (buyurtma formasi bilan mos boʻlishi kerak)")
    name = models.CharField("Nomi", max_length=60)
    tagline = models.CharField("Qisqa izoh", max_length=120, blank=True)
    price_text = models.CharField("Narx (matn)", max_length=60, help_text="Masalan: 2 000 000 yoki Kelishiladi")
    popular = models.BooleanField("Eng ommabop", default=False)
    features = models.JSONField("Imkoniyatlar", default=list, help_text='Ro\'yxat: ["Admin panel", "SEO"]')

    class Meta(Publishable.Meta):
        verbose_name = "Paket"
        verbose_name_plural = "Paketlar"

    def __str__(self):
        return self.name


class ComparisonRow(Publishable):
    label = models.CharField("Imkoniyat", max_length=120)
    start = models.CharField("Start", max_length=30, blank=True, help_text="+ bor, - yoʻq, yoki matn (masalan: 1 oy)")
    pro = models.CharField("Pro", max_length=30, blank=True)
    maktab_biznes = models.CharField("Maktab-Biznes", max_length=30, blank=True)

    class Meta(Publishable.Meta):
        verbose_name = "Taqqoslash qatori"
        verbose_name_plural = "Taqqoslash jadvali"

    def __str__(self):
        return self.label

    @property
    def values(self):
        def conv(v):
            v = v.strip()
            return True if v == "+" else False if v in ("-", "") else v

        return [conv(self.start), conv(self.pro), conv(self.maktab_biznes)]


class AddOn(Publishable):
    name = models.CharField("Nomi", max_length=100)
    text = models.CharField("Izoh", max_length=200, blank=True)
    price_text = models.CharField("Narx (matn)", max_length=60)

    class Meta(Publishable.Meta):
        verbose_name = "Qoʻshimcha xizmat"
        verbose_name_plural = "Qoʻshimcha xizmatlar"

    def __str__(self):
        return self.name


class Testimonial(Publishable):
    author = models.CharField("Ism", max_length=100)
    role = models.CharField("Lavozim / tashkilot", max_length=150, blank=True)
    text = models.TextField("Fikr")

    class Meta(Publishable.Meta):
        verbose_name = "Mijoz fikri"
        verbose_name_plural = "Mijoz fikrlari"

    def __str__(self):
        return self.author


class FAQ(Publishable):
    class Scope(models.TextChoices):
        HOME = "home", "Bosh sahifa"
        PRICING = "pricing", "Narxlar"

    scope = models.CharField("Qayerda", max_length=10, choices=Scope.choices, default=Scope.HOME)
    question = models.CharField("Savol", max_length=250)
    answer = models.TextField("Javob")

    class Meta(Publishable.Meta):
        verbose_name = "Savol-javob"
        verbose_name_plural = "Savol-javoblar"

    def __str__(self):
        return self.question


class Post(models.Model):
    slug = models.SlugField("URL manzil", unique=True)
    title = models.CharField("Sarlavha", max_length=200)
    description = models.CharField("Qisqa tavsif (SEO)", max_length=300)
    body = models.TextField("Matn (markdown)")
    date = models.DateField("Sana")
    published = models.BooleanField("Saytda koʻrsatish", default=True)

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "Maqola"
        verbose_name_plural = "Blog maqolalari"

    def __str__(self):
        return self.title


class Product(Publishable):
    """Tayyor raqamli mahsulot (taqdimot, shablon, video). Hozircha katalog; onlayn toʻlov keyinroq."""

    class Category(models.TextChoices):
        PRESENTATION = "taqdimot", "Taqdimot"
        TEMPLATE = "shablon", "Shablon"
        VIDEO = "video", "Video"
        OTHER = "boshqa", "Boshqa"

    slug = models.SlugField("URL manzil", unique=True, blank=True, max_length=80, help_text="Boʻsh qoldirsangiz nomidan yaratiladi")
    title = models.CharField("Nomi", max_length=150)
    description = models.TextField("Tavsif", blank=True)
    category = models.CharField("Toifa", max_length=10, choices=Category.choices, default=Category.OTHER)
    price_text = models.CharField("Narx (matn)", max_length=60, blank=True, help_text="Masalan: 50 000 soʻm yoki Kelishiladi")
    cover = models.ImageField("Rasm", upload_to="products/", blank=True)

    class Meta(Publishable.Meta):
        verbose_name = "Mahsulot"
        verbose_name_plural = "Mahsulotlar"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify

            base = slugify(self.title)[:60] or "mahsulot"
            slug, n = base, 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)
