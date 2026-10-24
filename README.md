# Izdoshlar: xizmatlar va portfolio sayti (1–2 bosqich)

React + Vite + Tailwind (frontend) va Django + DRF (backend). Interfeys o'zbek tilida (lotin).

```
frontend/   React sayt (build vaqtida statik HTML ga prerender qilinadi)
backend/    Django API: buyurtma qabul qilish + Telegram xabari
```

## Arxitektura (hozirgi): Supabase + Netlify

```
frontend/   React sayt (Netlify'da statik, build vaqtida prerender)
supabase/   Baza sxemasi (migrations/), namuna kontent (seed.sql), Edge Function (functions/submit-order)
backend/    ESKI Django backend (Supabase'ga ko'chirilgan; sinovdan keyin o'chiriladi)
```

- **Ochiq kontent** (loyiha, paket, FAQ, blog, mahsulot) Supabase jadvallaridan o'qiladi. Brauzer faqat "saytda ko'rsatish" belgilanganlarini ko'ra oladi (RLS).
- **Buyurtma formasi** -> Edge Function `submit-order`: tekshiruv, honeypot, tezlik cheklovi (soatiga 15, daqiqasiga 3), bazaga yozish, Telegram xabari. Brauzer `orders` jadvaliga to'g'ridan-to'g'ri yoza olmaydi.
- **`/boshqaruv`**: Supabase Auth (email + parol). Faqat `admins` jadvalidagi foydalanuvchilar kira oladi. Admin buyurtmaning faqat statusi va izohini o'zgartira oladi (bazadagi trigger majburlaydi), har bir status o'zgarishi tarixga yoziladi. Mahsulotlarni qo'shish/tahrirlash/o'chirish va rasm yuklash (Storage `media` bucket, 5 MB, PNG/JPG/WebP).
- **Boshqa kontent** (loyihalar, fikrlar, FAQ, blog, paketlar) hozircha Supabase dashboard -> Table Editor orqali tahrirlanadi.

### Supabase'ni sozlash

1. Loyiha yarating, `supabase/migrations/*.sql` va `supabase/seed.sql` ni SQL Editor'da ishga tushiring (yoki Supabase CLI: `supabase db push`).
2. `supabase/functions/submit-order` ni deploy qiling (`supabase functions deploy submit-order --no-verify-jwt`).
3. **Admin foydalanuvchi:** Dashboard -> Authentication -> Add user (email va parol, "Auto confirm" yoqing). So'ng SQL Editor'da:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'sizning@emailingiz';
   ```
4. **Telegram:** Dashboard -> Edge Functions -> Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. (Bo'sh bo'lsa buyurtma baribir saqlanadi, `notify_error` da "Telegram sozlanmagan" yoziladi.)
5. **Ruxsat etilgan domenlar (CORS):** Edge Function secret `ALLOWED_ORIGINS` (vergul bilan). Standart: `https://izdoshlar-uz.netlify.app,http://localhost:5173`. Haqiqiy domen qo'shilganda yangilang.
6. Frontend `.env` / Netlify o'zgaruvchilari: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable kalit; brauzerda bo'lishi mo'ljallangan). **Hech qachon `service_role` kalitni frontendga qo'ymang.**
7. Production'da `VITE_REQUIRE_API=1`: Supabase javob bermasa build to'xtaydi va eski kontent chiqib ketmaydi.

### Testlar

```bash
node --test supabase/tests/submit-order.test.ts   # buyurtma tekshiruvi va Telegram matni (18 ta)
```

Bazaning xavfsizlik qoidalari (anon nimani o'qiy/yoza oladi, admin chegaralari) Supabase'da haqiqiy so'rovlar bilan tekshirilgan: README oxiridagi "Xavfsizlik tekshiruvi" ro'yxatiga qarang.

> Pastdagi Django (`backend/`) bo'limlari eski arxitektura uchun. Supabase'ga to'liq o'tilgach o'chiriladi.

## Admin panel, statistika va biznes tahlili

**Admin panel** (`/boshqaruv`, sayt sarlavhasi va footerisiz, alohida to'liq ekran): yon menyu, Supabase login.

| Bo'lim | Nima qiladi |
|---|---|
| Statistika | Tashrif buyuruvchilar, ko'rishlar, buyurtmalar, konversiya, demo ochilishlari (oldingi davr bilan taqqoslash), dinamika grafigi, hozir onlayn, top sahifalar, manbalar, UTM, qurilma, brauzer, OT, davlat, soatlar, harakatlar, buyurtmalar holati/xizmati; 7/30/90 kun, CSV |
| Buyurtmalar | Filtr, qidiruv, status, ichki izoh, status tarixi, CSV yuklash (Excel formulalaridan himoyalangan) |
| Mahsulotlar | Qo'shish, tahrirlash, rasm yuklash, yashirish, o'chirish |
| Sozlamalar | Parolni almashtirish |

**Statistika** cookie'siz va anonim: sayt `track` Edge Function'iga sahifa ko'rishlari va harakatlarni yuboradi; IP saqlanmaydi, "sid" har kuni yangilanadigan qaytarib bo'lmaydigan xesh. Botlar, `/boshqaruv`, "Kuzatma" (DNT) yoqilgan brauzerlar va admin o'z brauzerida hisoblanmaydi. Ma'lumotlar 180 kundan keyin o'chiriladi. Hisob: `public.admin_stats(kunlar)` (faqat admin).

**Biznes tahlili** (`/tahlil`): mijoz biznes turi, og'riqli nuqtalar va jamoa hajmini belgilaydi, qoidalar asosida taxminiy yechimlar, muddat va mos paketni oladi, "Shuni tayyorlab bering" tugmasi buyurtma formasini shu ma'lumot bilan to'ldirib ochadi. Yechimlar va muammolar: `frontend/src/i18n/diagnosis.uz.ts` (qo'shish/o'zgartirish oson), mantiq: `frontend/src/lib/diagnosis.ts`. Bu AI emas, qoidalar asosidagi taxminiy tavsiya.

Testlar:

```bash
node --test supabase/tests/submit-order.test.ts supabase/tests/track.test.ts frontend/tests/diagnosis.test.ts
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
- Throttle: IP bo'yicha soatiga 15 ta va daqiqasiga 3 ta (`ORDER_THROTTLE`, `ORDER_THROTTLE_BURST`). Mobil operatorlar ko'p abonentni bitta IP ostiga qo'yadi, shuning uchun juda qattiq qilinmagan.
- Forma yuborilishi uchun maxfiylik siyosatiga rozilik majburiy (server ham tekshiradi va rozilik vaqtini saqlaydi).
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

## Netlify'ga qo'lda deploy (CLI)

Sinov sayti: https://izdoshlar-uz.netlify.app (qidiruv tizimlariga yopiq, `VITE_NOINDEX=1`).

**Muhim:** lokal `frontend/.env` da sinov qiymatlari bor (`localhost` API, namuna Telegram/telefon). `netlify deploy` o'zi qayta build qiladi va `.env` ni o'qiydi, shuning uchun u qiymatlar ommaviy saytga tushib ketishi mumkin. Xavfsiz tartib:

```bash
cd frontend
mv .env .env.bak
VITE_API_URL= VITE_NOINDEX=1 VITE_ENABLE_BUSINESS=0 VITE_SITE_URL=https://izdoshlar-uz.netlify.app npm run build
mv .env.bak .env
npx netlify-cli deploy --prod --no-build --dir=dist
```

Ishlab chiqarishda `VITE_API_URL` berilmasa, sayt API'ga murojaat qilmaydi va zaxira kontentdan foydalanadi (buyurtma formasi esa backend bo'lmaguncha xato beradi). Doimiy yechim: Netlify'da GitHub repo'ni ulab (Base directory: `frontend`), o'zgaruvchilarni Site settings → Environment variables ga yozish; shunda har `git push` o'zi build qilinadi va lokal `.env` ishtirok etmaydi.

## Mahsulotlar katalogi va saytdagi boshqaruv

Mahsulotlarni (taqdimot, shablon, video) ikki joydan boshqarish mumkin:

- **Saytning o'zidan:** `/boshqaruv` -> login -> **Mahsulotlar** tabi. Qo'shish, tahrirlash, rasm yuklash (PNG/JPG/WebP, 5 MB gacha), yashirish/ko'rsatish va o'chirish. Buyurtmalar ham shu sahifada (**Buyurtmalar** tabi).
- **Django admin:** `/admin/` -> Kontent -> Mahsulotlar.

Ochiq katalog: `/mahsulotlar` sahifasi va `GET /api/v1/products/` (faqat "saytda ko'rsatish" belgilanganlari). Har bir kartadagi "Buyurtma berish" tugmasi formani mahsulot nomi bilan to'ldirib ochadi. Boshqaruv API: `/api/v1/admin/products/` (token bilan, faqat xodim).

Hozircha katalog onlayn to'lovsiz: mijoz buyurtma qoldiradi, siz bilan bog'lanadi. To'lov va fayl yuklab olish keyingi bosqichda shu modelga ulanadi.

**Eslatma:** bu faqat backend ishlaganda ishlaydi. Jonli saytga chiqarish uchun backend'ni serverga joylash, `VITE_API_URL` ga manzilini yozish va rasmlar uchun nginx'da `/media/` ni berish kerak (yuqoridagi deploy bo'limiga qarang).

## Biznes yo'nalishi (standart: yoqilgan)

Sayt biznes uchun raqamli yechimlar sifatida joylashtirilgan; maktab/o'quv markazi shu yo'nalishning tayyor vertikal yechimi (`/maktablar`). Biznes yo'nalishi (sayt/bot/AI agent xizmatlari, Narxlar sahifasi va paketlar) `VITE_ENABLE_BUSINESS` bilan boshqariladi (standart: yoqilgan):

- `0`: Narxlar sahifasi, menyudagi havola va sitemap yozuvi chiqmaydi; hero va bosh sahifa maktablarga qaratilgan; forma "Demo so'rovi" bilan ochiladi va paket tanlovi yo'q.
- `1` yoki berilmagan (standart): hammasi ko'rinadi. Frontendni qayta build qiling (Vercel/Netlify'da o'zgaruvchini qo'shib redeploy).

Backend o'zgarmaydi, u har ikkala holatda ham barcha turdagi buyurtmalarni qabul qiladi. Eslatma: `/oferta` matnida paketlar tilga olingan, biznesni ochganda yoki ochmasdan oldin yurist bilan ko'rib chiqing.

## Bildirishnoma ishonchliligi

Buyurtma avval bazaga yoziladi, keyin Telegram'ga yuboriladi. Telegram ishlamasa:

1. `backend/.env` da `ORDER_NOTIFY_EMAIL` (va `EMAIL_*`) bo'lsa, xabar zaxira sifatida emailga ketadi.
2. Hech biri ketmasa, buyurtma baribir saqlanadi va admin'da `notified_at` bo'sh turadi.
3. `python manage.py retry_notifications` yuborilmaganlarini qayta urinadi (oxirgi 72 soat). Uni cron bilan har 10 daqiqada ishga tushiring: `deploy/crontab.example`.

## Huquqiy hujjatlar

`/maxfiylik` (Maxfiylik siyosati) va `/oferta` (Ommaviy oferta) sahifalari, footerdagi havolalar va forma yonidagi rozilik belgisi qo'shilgan. Matnlar: `frontend/src/i18n/legal.uz.ts`.

> **Diqqat:** bu matnlar NAMUNA shablon, yurist emas yozgan. Saytni ochishdan oldin yurist ko'rigidan o'tkazing (ayniqsa saqlash muddati 12 oy, bepul qo'llab-quvvatlash muddatlari, javobgarlik va qaytarish bandlari). Rekvizitlarni `frontend/.env` ga yozing: `VITE_LEGAL_NAME`, `VITE_LEGAL_INN`, `VITE_LEGAL_ADDRESS`, `VITE_CONTACT_EMAIL`. Ular hujjatlar va footerga avtomatik qo'yiladi. Payme/Click merchant hisobi uchun ham oferta va rekvizitlar saytda bo'lishi talab qilinadi.

## Deploy fayllari

| Fayl | Nima uchun |
|---|---|
| `frontend/vercel.json` | Vercel: chiroyli URL'lar (`/narxlar`), xavfsizlik sarlavhalari, kesh, `/boshqaruv` uchun noindex |
| `frontend/netlify.toml` | Netlify uchun xuddi shu (Base directory: `frontend`) |
| `frontend/public/404.html` | Mavjud bo'lmagan manzillar uchun sahifa (JS'siz) |
| `deploy/nginx-api.conf.example` | API uchun nginx (proksi, `/media/`, buyurtma endpointiga qo'shimcha cheklov) |
| `deploy/izdoshlar.service` | gunicorn uchun systemd xizmati |
| `deploy/backup.sh` | PostgreSQL va `media/` kundalik zaxirasi (14 kun saqlanadi) |
| `deploy/crontab.example` | Bildirishnomani qayta urinish, zaxira, sessiyalarni tozalash |

**Muhim:** statik hostingda `/narxlar` manzili `narxlar/index.html` ga yo'naltirilishi shart. Vercel va Netlify buni o'zi qiladi; nginx'da `try_files $uri $uri/index.html /404.html;` ishlating. Aks holda bosh sahifa chiqib qoladi (`vite preview` ham shunday qiladi, `/narxlar/` bilan tekshiring).

Hali qilinmagan: frontend uchun CSP sarlavhasi (domen aniq bo'lgach qo'shiladi), CI, Dockerfile.

## Keyingi bosqichlar

2. ✅ Bajarildi.
3. Mahsulotlar, buyurtmalar va to'lovlar (Click / Payme / Uzum), feature flag ortida.

## Xavfsizlik tekshiruvi (Supabase, haqiqiy so'rovlar bilan)

- Anon kalit bilan: faqat "ko'rsatilgan" kontent o'qiladi; yashirin yozuvlar, `orders`, `admins`, `rate_limits` yopiq; `orders`, `products` ga yozish va Storage'ga yuklash rad etiladi; `hit_rate_limit` va `am_i_admin` funksiyalari chaqirilmaydi.
- Edge Function: noto'g'ri ma'lumot 400, honeypot va juda tez yuborilgan so'rov jim qabul qilinib saqlanmaydi, tezlik cheklovi 429, CORS faqat ruxsat etilgan domenlarga.
- Oddiy (admin bo'lmagan) foydalanuvchi `/boshqaruv` ga kira olmaydi. Admin `name`/`phone` kabi maydonlarni o'zgartira olmaydi (403), buyurtma yarata va o'chira olmaydi, noto'g'ri statusni qo'ya olmaydi.
- Supabase xavfsizlik tekshiruvi (advisors): faqat `admins` va `rate_limits` "siyosatsiz" ko'rsatildi. Bu ataylab: ikkalasi hamma uchun yopiq.
