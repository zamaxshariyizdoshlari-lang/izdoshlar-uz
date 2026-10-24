# Izdoshlar: biznes uchun raqamli yechimlar sayti

React + Vite + Tailwind (frontend) va Supabase (baza, Auth, Storage, Edge Functions). Interfeys o'zbek tilida (lotin).

## Arxitektura (hozirgi): Supabase + Netlify

```
frontend/   React sayt (Netlify'da statik, build vaqtida prerender)
supabase/   Baza sxemasi (migrations/), namuna kontent (seed.sql), Edge Function (functions/submit-order)
```

- **Ochiq kontent** (loyiha, paket, FAQ, blog, mahsulot) Supabase jadvallaridan o'qiladi. Brauzer faqat "saytda ko'rsatish" belgilanganlarini ko'ra oladi (RLS).
- **Buyurtma formasi** -> Edge Function `submit-order`: tekshiruv, honeypot, tezlik cheklovi (soatiga 15, daqiqasiga 3), bazaga yozish, Telegram xabari. Brauzer `orders` jadvaliga to'g'ridan-to'g'ri yoza olmaydi.
- **`/boshqaruv`**: Supabase Auth (email + parol). Faqat `admins` jadvalidagi foydalanuvchilar kira oladi. Admin buyurtmaning faqat statusi va izohini o'zgartira oladi (bazadagi trigger majburlaydi), har bir status o'zgarishi tarixga yoziladi. Mahsulotlarni qo'shish/tahrirlash/o'chirish va rasm yuklash (Storage `media` bucket, 5 MB, PNG/JPG/WebP).
- **Kontent** (FAQ, fikrlar, blog, loyiha matnlari, paketlar) `/boshqaruv#kontent` dan tahrirlanadi. Loyihalar sahifasi asosan **demolar**dan iborat (`/boshqaruv#demolar`).

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

## Admin panel, statistika va biznes tahlili

**Admin panel** (`/boshqaruv`, sayt sarlavhasi va footerisiz, alohida to'liq ekran): yon menyu, Supabase login.

| Bo'lim | Nima qiladi |
|---|---|
| Statistika | Tashrif buyuruvchilar, ko'rishlar, buyurtmalar, konversiya, demo ochilishlari (oldingi davr bilan taqqoslash), dinamika grafigi, hozir onlayn, top sahifalar, manbalar, UTM, qurilma, brauzer, OT, davlat, soatlar, harakatlar, buyurtmalar holati/xizmati; 7/30/90 kun, CSV |
| Buyurtmalar | Filtr, qidiruv, status, ichki izoh, status tarixi, CSV yuklash (Excel formulalaridan himoyalangan) |
| Mahsulotlar | Qo'shish, tahrirlash, rasm yuklash, yashirish, o'chirish |
| Kontent | Savol-javob, mijoz fikrlari, blog, loyiha matnlari, narx paketlari va qo'shimcha xizmatlarni qo'shish/tahrirlash/yashirish/o'chirish |
| Statistika (voronka) | Tashrif -> loyiha/demo -> tahlil/narx/aloqa -> so'rov bosqichlari (`admin_funnel`) |
| Demolar | Tayyor saytni .zip (index.html ildizda; Vite uchun `base: './'`) yoki https havola sifatida qo'shish; `/demolar` sahifasida mijozlar telefon/planshet/kompyuter ko'rinishida sinaydi |
| Sozlamalar | Parolni almashtirish |

**Statistika** cookie'siz va anonim: sayt `track` Edge Function'iga sahifa ko'rishlari va harakatlarni yuboradi; IP saqlanmaydi, "sid" har kuni yangilanadigan qaytarib bo'lmaydigan xesh. Botlar, `/boshqaruv`, "Kuzatma" (DNT) yoqilgan brauzerlar va admin o'z brauzerida hisoblanmaydi. Ma'lumotlar 180 kundan keyin o'chiriladi. Hisob: `public.admin_stats(kunlar)` (faqat admin).

**Biznes tahlili** (`/tahlil`): mijoz biznes turi, og'riqli nuqtalar va jamoa hajmini belgilaydi, qoidalar asosida taxminiy yechimlar, muddat va mos paketni oladi, "Shuni tayyorlab bering" tugmasi buyurtma formasini shu ma'lumot bilan to'ldirib ochadi. Yechimlar va muammolar: `frontend/src/i18n/diagnosis.uz.ts` (qo'shish/o'zgartirish oson), mantiq: `frontend/src/lib/diagnosis.ts`. Bu AI emas, qoidalar asosidagi taxminiy tavsiya.

Testlar:

```bash
node --test supabase/tests/submit-order.test.ts supabase/tests/track.test.ts supabase/tests/telegram-bot.test.ts frontend/tests/diagnosis.test.ts
```

## Lokal ishga tushirish

```bash
cd frontend
cp .env.example .env     # VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni yozing
npm install
npm run dev              # http://localhost:5173
```

Asosiy o'zgaruvchilar (`frontend/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_TELEGRAM_USERNAME`, `VITE_CONTACT_PHONE`, `VITE_CONTACT_EMAIL`, `VITE_LEGAL_NAME`, `VITE_LEGAL_INN`, `VITE_LEGAL_ADDRESS`, `VITE_BRAND_NAME`, `VITE_NOINDEX` (sinov saytida 1), `VITE_ENABLE_BUSINESS` (standart yoqilgan, `0` o'chiradi), `VITE_REQUIRE_API` (production'da 1).

## Telegram bot

Edge Function `telegram-bot` (webhook): `/start` menyu, narxlar (paketlardan), loyihalar (demolardan), bepul tahlil havolasi, aloqa va buyurtma qoldirish (rozilik, ism, telefon, tavsif). Buyurtma `orders` jadvaliga tushadi (manba `/telegram-bot`) va egasiga Telegram xabari boradi. Suhbat holati `bot_sessions` jadvalida (faqat service_role). Webhook sirri bot tokenidan olinadi, qo'shimcha secret kerak emas.

Ulash (bir marta): brauzerda `https://<loyiha>.supabase.co/functions/v1/telegram-bot?setup=1` ni oching. Ixtiyoriy secret'lar: `SITE_URL`, `CONTACT_TELEGRAM`, `CONTACT_PHONE`. Tokenni almashtirsangiz `?setup=1` ni qayta oching.

## Demolar

Admin -> Demolar. Ikki usul:
- **Tayyor havola:** sayt internetda ochiq bo'lsa (masalan, alohida Netlify sayti). Sayt boshqa saytda ochilishiga ruxsat berishi kerak: `X-Frame-Options: DENY` yoki `frame-ancestors 'none'` bo'lsa, demo ichi bo'sh chiqadi. Ruxsat berish uchun `frame-ancestors` ga sayt manzilini qo'shing.
- **Zip yuklash:** faqat oddiy statik sayt (HTML/CSS/JS/rasm). Demo xavfsizlik uchun izolyatsiyalangan oynada ochiladi, shuning uchun `localStorage`/`sessionStorage`, cookie va `BrowserRouter` ishlatadigan React ilovalar zip ichida ishlamaydi. Ularni alohida joylab, havola bilan qo'shing.
- Login talab qiladigan demo uchun "Kirish ma'lumoti" maydoniga faqat test hisob yozing: u hammaga ko'rinadi.

`/demolar/*` Netlify'da bitta tayyor sahifaga yo'naltiriladi (`netlify.toml`), demo ma'lumoti brauzerda olinadi, shuning uchun yangi demo qo'shgach qayta build shart emas.

## Deploy (Netlify)

Sayt: https://izdoshlar-uz.netlify.app (sinov, `VITE_NOINDEX=1`). Netlify'ga lokal `.env` tushib ketmasligi uchun toza build qiling:

```bash
cd frontend
mv .env .env.bak
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... VITE_REQUIRE_API=1 VITE_NOINDEX=1 VITE_SITE_URL=https://izdoshlar-uz.netlify.app npm run build
mv .env.bak .env
grep -rlE "localhost|your_username|service_role" dist   # hech narsa chiqmasligi kerak
npx netlify deploy --prod --dir=dist --no-build
```

Doimiy yechim: Netlify'da GitHub repo'ni ulab (Base directory: `frontend`), o'zgaruvchilarni Site settings -> Environment variables ga yozing.

| Fayl | Nima uchun |
|---|---|
| `frontend/netlify.toml` | Netlify: `/demolar/*` yo'naltirish, xavfsizlik sarlavhalari, kesh |
| `frontend/vercel.json` | Vercel uchun xuddi shu |
| `frontend/public/404.html` | Mavjud bo'lmagan manzillar uchun sahifa |

Statik hostingda `/narxlar` manzili `narxlar/index.html` ga yo'naltirilishi shart (`vite preview` buni qilmaydi, `/narxlar/` bilan tekshiring).

## Testlar

```bash
node --test supabase/tests/submit-order.test.ts supabase/tests/track.test.ts supabase/tests/telegram-bot.test.ts frontend/tests/diagnosis.test.ts
cd frontend && npx tsc -b
```

## Bildirishnoma ishonchliligi

Buyurtma har doim bazaga yoziladi; Telegram yetib bormasa `orders.notify_error` to'ladi va admin buyurtmalar ro'yxatida "Telegramga yuborilmadi" belgisi chiqadi.

## Huquqiy hujjatlar

`/maxfiylik` (Maxfiylik siyosati) va `/oferta` (Ommaviy oferta) sahifalari, footerdagi havolalar va forma yonidagi rozilik belgisi qo'shilgan. Matnlar: `frontend/src/i18n/legal.uz.ts`.

> **Diqqat:** bu matnlar NAMUNA shablon, yurist emas yozgan. Saytni ochishdan oldin yurist ko'rigidan o'tkazing (ayniqsa saqlash muddati 12 oy, bepul qo'llab-quvvatlash muddatlari, javobgarlik va qaytarish bandlari). Rekvizitlarni `frontend/.env` ga yozing: `VITE_LEGAL_NAME`, `VITE_LEGAL_INN`, `VITE_LEGAL_ADDRESS`, `VITE_CONTACT_EMAIL`. Ular hujjatlar va footerga avtomatik qo'yiladi. Payme/Click merchant hisobi uchun ham oferta va rekvizitlar saytda bo'lishi talab qilinadi.

## Xavfsizlik tekshiruvi (Supabase, haqiqiy so'rovlar bilan)

- Anon kalit bilan: faqat "ko'rsatilgan" kontent o'qiladi; yashirin yozuvlar, `orders`, `admins`, `rate_limits` yopiq; `orders`, `products` ga yozish va Storage'ga yuklash rad etiladi; `hit_rate_limit` va `am_i_admin` funksiyalari chaqirilmaydi.
- Edge Function: noto'g'ri ma'lumot 400, honeypot va juda tez yuborilgan so'rov jim qabul qilinib saqlanmaydi, tezlik cheklovi 429, CORS faqat ruxsat etilgan domenlarga.
- Oddiy (admin bo'lmagan) foydalanuvchi `/boshqaruv` ga kira olmaydi. Admin `name`/`phone` kabi maydonlarni o'zgartira olmaydi (403), buyurtma yarata va o'chira olmaydi, noto'g'ri statusni qo'ya olmaydi.
- Supabase xavfsizlik tekshiruvi (advisors): faqat `admins` va `rate_limits` "siyosatsiz" ko'rsatildi. Bu ataylab: ikkalasi hamma uchun yopiq.
