# Izdoshlar: xizmatlar va portfolio sayti (1–2 bosqich)

React + Vite + Tailwind (frontend) va Django + DRF (backend). Interfeys o'zbek tilida (lotin).

```
frontend/   React sayt (build vaqtida statik HTML ga prerender qilinadi)
backend/    Django API: buyurtma qabul qilish + Telegram xabari
```

## Lokal ishga tushirish

**Backend** (Python 3.12+):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # qiymatlarni to'ldiring
python manage.py migrate
python manage.py createcachetable   # rate limit uchun kesh jadvali
python manage.py createsuperuser    # admin uchun
python manage.py seed_catalog       # namuna kontentni bazaga yuklaydi (qayta ishga tushirsa ham xavfsiz)
python manage.py runserver 8000
```

**Frontend** (Node 20+):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                     # http://localhost:5173
```

Admin panel: `http://localhost:8000/admin/`. Bu yerda boshqariladi: buyurtmalar, loyihalar (rasmlar bilan), paketlar, taqqoslash jadvali, qo'shimchalar, mijoz fikrlari, FAQ va blog maqolalari. Har bir kontent turida «Saytda ko'rsatish» va «Tartib» maydonlari bor.

## Testlar

```bash
cd backend && python manage.py test
```

Buyurtma endpointi (validatsiya, honeypot, tezlik tekshiruvi, rate limit) va Telegram yuborish (xato bo'lganda ham buyurtma saqlanishi, token sizib chiqmasligi) tekshiriladi.

## Telegram bildirishnomasi

1. Telegramda `@BotFather` orqali bot yarating va tokenni oling.
2. Botga biror xabar yozing, so'ng `https://api.telegram.org/bot<TOKEN>/getUpdates` orqali `chat.id` ni toping.
3. `backend/.env` ga `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` ni yozing.

Token **faqat serverda** turadi, frontendda yo'q. Telegram ishlamasa ham buyurtma saqlanadi; admin panelda `notify_error` ustunida sabab ko'rinadi.

## Spamdan himoya

- Yashirin honeypot maydon (`website`): to'ldirilsa, buyurtma saqlanmaydi.
- Forma 3 soniyadan tez yuborilsa, saqlanmaydi (`ORDER_MIN_FILL_SECONDS`).
- Throttle: IP bo'yicha soatiga 5 ta va daqiqasiga 2 ta (`ORDER_THROTTLE`, `ORDER_THROTTLE_BURST`).
- Nginx orqasida `NUM_PROXIES=1` qo'ying, aks holda barcha foydalanuvchilar bitta IP bo'lib ko'rinadi.
- Qat'iy validatsiya: +998 telefon, Telegram username, URL, uzunlik chegaralari.

## Kontentni almashtirish

| Nima | Qayerda |
|---|---|
| Matnlar | `frontend/src/i18n/uz.ts` |
| Loyihalar, paketlar, fikrlar, FAQ, blog | Django admin (zaxira nusxa: `frontend/src/data/*.json`, `content/blog`) |
| Loyihalar (zaxira) | `frontend/src/data/projects.json` |
| Paketlar, qo'shimchalar, narxlar | `frontend/src/data/packages.json` (`[NARX]` ni almashtiring) |
| Mijoz fikrlari | `frontend/src/data/testimonials.json` (haqiqiy fikrlar bilan) |
| Savol-javoblar | `frontend/src/data/faq.json` |
| Blog | `frontend/src/content/blog/*.md` (nomi = URL manzili) |
| Brend, domen, Telegram | `frontend/.env` |

## Kontent qanday yangilanadi (2-bosqich)

Sahifalar SEO uchun build vaqtida **statik HTML** ga aylantiriladi va ma'lumot Django API'dan olinadi. Shuning uchun admin'da o'zgartirish saytda ko'rinishi uchun frontend qayta build qilinishi kerak:

1. Vercel/Netlify'da **Deploy Hook** yarating va URL'ni `backend/.env` dagi `FRONTEND_DEPLOY_HOOK_URL` ga qo'ying.
2. Admin'da kontent saqlansa, backend 60 soniyadan so'ng hook'ni chaqiradi (ketma-ket saqlashlar bitta build'ga birlashadi). Build 1–2 daqiqa oladi.
3. Frontend'da `VITE_REQUIRE_API=1` qo'ying: API javob bermasa build to'xtaydi va eski/namuna kontent ishlab chiqarishga chiqib ketmaydi.

Sahifalar orasida o'tganda brauzer API'dan yangi ma'lumotni qayta oladi. Rasmlar `backend/media/` ga yuklanadi; ishlab chiqarishda nginx'da `location /media/ { alias /path/to/backend/media/; }` qo'shing.

## Buyurtma statuslari

`yangi → muzokara → jarayonda → tugadi`. Statusni Django admin'da (ro'yxatda tahrirlash yoki ommaviy amal) yoki API orqali o'zgartirish mumkin; har bir o'zgarish tarixga (kim, qachon, qaysi holatdan) yoziladi. Cheklov yo'q: ish orqaga qaytsa, statusni ham qaytarish mumkin. «Ichki izoh» maydoniga narx va kelishuvni yozing, u faqat sizga ko'rinadi.

Token bilan API:

```bash
curl -X POST $API/auth/token/ -d "username=..." -d "password=..."           # {"token": "..."}
curl -H "Authorization: Token <token>" "$API/admin/orders/?status=yangi"
curl -X PATCH -H "Authorization: Token <token>" -H "Content-Type: application/json"      -d '{"status": "muzokara"}' $API/admin/orders/<id>/
```

## Ochiq API

`GET /projects/` (`?category=`), `/projects/{slug}/`, `/packages/`, `/comparison/`, `/addons/`, `/testimonials/`, `/faq/` (`?scope=home|pricing`), `/posts/`, `/posts/{slug}/`. Faqat «Saytda ko'rsatish» belgilanganlari qaytadi.

Tarjimadagi `[NARX]`, `[NATIJA]`, `[DOMAIN]` kabi belgilar to'ldirilishi kerak bo'lgan joylardir.

## Deploy

### Frontend (Vercel yoki Netlify)

- Root directory: `frontend`, build: `npm run build`, output: `dist`.
- Muhit o'zgaruvchilari: `VITE_API_URL=https://api.sizning-domen.uz/api/v1`, `VITE_SITE_URL=https://sizning-domen.uz`, `VITE_BRAND_NAME`.
- Build `sitemap.xml` va `robots.txt` ni avtomatik yaratadi (`VITE_SITE_URL` bo'yicha).
- Sahifalar prerender qilingani uchun SPA rewrite kerak emas. Mavjud bo'lmagan manzillar uchun `404.html` qo'shish mumkin.

### Backend (VPS: Ubuntu + gunicorn + nginx)

```bash
git clone <repo> && cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-prod.txt
cp .env.example .env     # DEBUG=0, SECRET_KEY, ALLOWED_HOSTS, CORS_ORIGINS, DATABASE_URL, NUM_PROXIES=1
python manage.py migrate && python manage.py createcachetable
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

- `gunicorn` ni systemd xizmati sifatida ishga tushiring, nginx esa `proxy_pass http://127.0.0.1:8000` va `X-Forwarded-For` / `X-Forwarded-Proto` sarlavhalarini uzatsin.
- HTTPS: `certbot --nginx`.
- Ishlab chiqarishda PostgreSQL: `DATABASE_URL=postgres://user:pass@localhost:5432/dbname`.
- `DEBUG=0` bo'lganda `SECRET_KEY` majburiy, aks holda server ishga tushmaydi.

## Keyingi bosqichlar

2. ✅ Bajarildi.
3. Mahsulotlar, buyurtmalar va to'lovlar (Click / Payme / Uzum), feature flag ortida.
