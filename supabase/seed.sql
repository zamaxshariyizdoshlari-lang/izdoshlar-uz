-- Boshlangʻich kontent (namuna). Faqat boʻsh jadvallarga: qayta ishga tushirmang.

begin;

insert into public.projects (slug, title, category, summary, problem, solution, result, tech, featured, placeholder, sort_order) values
  ('namuna-maktab-erp', 'Namuna: Maktab ERP tizimi', 'erp', 'Davomat, baholar va ota-onalar bilan aloqani bitta tizimga jamlagan namuna loyiha.', 'Maktabda davomat va baholar qogʻozda yuritilardi, ota-onalar bola haqida kech xabar topardi, hisobot tayyorlash kunlar olardi.', 'Davomat, baho, jadval va ota-onalar kabineti bitta veb-tizimga jamlandi. Oʻqituvchi telefondan ham toʻldira oladi.', '[NATIJA: masalan, hisobot vaqti 3 kundan 10 daqiqagacha qisqardi]', array['React', 'Django', 'PostgreSQL']::text[], true, true, 0),
  ('namuna-dars-jadvali', 'Namuna: Avtomatik dars jadvali', 'erp', 'Oʻqituvchi va xonalar cheklovlarini hisobga olib jadval tuzadigan namuna modul.', 'Dars jadvalini qoʻlda tuzish haftalar olardi va doim toʻqnashuvlar chiqardi.', 'Cheklovlarni kiritish bilan jadval avtomatik tuziladi, toʻqnashuvlar koʻrsatiladi, qoʻlda tuzatish mumkin.', '[NATIJA: jadval tuzish vaqti va xatolar soni]', array['Python', 'Django', 'React']::text[], true, true, 1),
  ('namuna-telegram-bot', 'Namuna: Buyurtma qabul qiluvchi Telegram bot', 'ai-bot', 'Mijoz savollariga javob beradigan va buyurtmani adminga yetkazadigan namuna bot.', 'Doʻkon egasi kechayu kunduz xabarlarga javob berishga majbur edi va baʼzi mijozlar yoʻqolardi.', 'Bot savollarga javob beradi, buyurtmani yigʻadi va adminga Telegram orqali yuboradi.', '[NATIJA: javob vaqti va buyurtmalar soni]', array['Python', 'Telegram Bot API', 'Django']::text[], true, true, 2),
  ('namuna-markaz-sayti', 'Namuna: Oʻquv markazi sayti', 'sayt', 'Kurslar, narxlar va roʻyxatdan oʻtish formasi bor tez va zamonaviy sayt.', 'Markazning sayti yoʻq edi, oʻquvchilar faqat Instagram orqali murojaat qilardi.', 'Kurslar katalogi, oʻqituvchilar sahifasi va ariza formasi bor, telefonda qulay sayt yaratildi.', '[NATIJA: murojaatlar soni oʻsishi]', array['React', 'Tailwind', 'Django']::text[], false, true, 3),
  ('namuna-taqdimotlar', 'Namuna: Dars taqdimotlari toʻplami', 'kontent', 'Oʻqituvchilar uchun tayyor, chiroyli va tahrirlash oson taqdimotlar toʻplami.', 'Oʻqituvchilar har dars uchun taqdimot tayyorlashga soatlab vaqt sarflardi.', 'Mavzular boʻyicha tayyor, bir xil uslubdagi va oson tahrirlanadigan taqdimotlar tayyorlandi.', '[NATIJA: foydalanuvchilar soni yoki fikrlar]', array['PowerPoint', 'Canva']::text[], false, true, 4);

insert into public.packages (key, name, tagline, price_text, popular, features, sort_order) values
  ('start', 'Start', 'Boshlovchi biznes uchun', '[NARX]', false, array['Bir sahifali sayt yoki oddiy bot', 'Telefonga moslashgan dizayn', 'Aloqa formasi', '1 oy bepul qoʻllab-quvvatlash']::text[], 0),
  ('pro', 'Pro', 'Oʻsayotgan biznes uchun', '[NARX]', true, array['Koʻp sahifali sayt yoki funksiyali bot', 'Admin panel', 'SEO asoslari', 'Telegram bildirishnomalar', '3 oy bepul qoʻllab-quvvatlash']::text[], 1),
  ('maktab_biznes', 'Korporativ', 'Yirik tashkilot va maktablar uchun', '[NARX]', false, array['Toʻliq tizim (ERP / veb-ilova)', 'Foydalanuvchi rollari', 'Hisobotlar va statistika', 'Oʻqitish va ishga tushirish', '6 oy bepul qoʻllab-quvvatlash']::text[], 2);

insert into public.comparison_rows (label, "values", sort_order) values
  ('Telefonga moslashgan dizayn', '[true, true, true]'::jsonb, 0),
  ('Admin panel', '[false, true, true]'::jsonb, 1),
  ('SEO asoslari', '[false, true, true]'::jsonb, 2),
  ('Telegram bildirishnomalar', '[false, true, true]'::jsonb, 3),
  ('Foydalanuvchi rollari', '[false, false, true]'::jsonb, 4),
  ('Hisobotlar va statistika', '[false, false, true]'::jsonb, 5),
  ('Oʻqitish va ishga tushirish', '[false, false, true]'::jsonb, 6),
  ('Bepul qoʻllab-quvvatlash', '["1 oy", "3 oy", "6 oy"]'::jsonb, 7);

insert into public.addons (name, text, price_text, sort_order) values
  ('Qoʻshimcha til (rus / ingliz)', 'Saytni boshqa tilga ham tarjima qilamiz.', '[NARX]', 0),
  ('Instagram bot', 'Direct xabarlarga avtomatik javob.', '[NARX]', 1),
  ('AI yordamchi', 'Savollarga javob beruvchi aqlli yordamchi.', '[NARX]', 2),
  ('Hosting va domen', 'Yillik hosting va domen sozlash.', '[NARX]', 3),
  ('Oylik qoʻllab-quvvatlash', 'Yangilanish, xatolarni tuzatish va kichik oʻzgarishlar.', '[NARX]', 4);

insert into public.faq (scope, question, answer, sort_order) values
  ('home', 'Buyurtma berganimdan keyin nima boʻladi?', 'Bir ish kuni ichida siz bilan bogʻlanamiz, vazifani aniqlaymiz, muddat va narxni kelishamiz. Faqat kelishuvdan keyin ish boshlanadi.', 0),
  ('home', 'Narxni qanday bilaman?', 'Narx loyiha hajmiga bogʻliq. Buyurtma qoldirganingizdan keyin aniq narxni oldindan aytamiz, yashirin toʻlovlar yoʻq.', 1),
  ('home', 'Toʻlov qanday amalga oshiriladi?', 'Katta xizmatlar uchun narx kelishilgach, karta orqali oʻtkazma qilinadi. Tayyor mahsulotlar uchun keyinroq onlayn toʻlov qoʻshiladi.', 2),
  ('home', 'Yechimni avval koʻrsata olasizmi?', 'Ha. Buyurtma yoki demo formasini toʻldiring, biz yechimni sizga koʻrsatib beramiz (maktablar uchun tayyor demo bor). Bu majburiyat emas.', 3),
  ('home', 'Ishga tushgandan keyin yordam berasizmi?', 'Ha. Har bir paketda bepul qoʻllab-quvvatlash davri bor, undan keyin oylik xizmat mavjud.', 4),
  ('pricing', 'Paketdagi narxga hamma narsa kiradimi?', 'Paketda koʻrsatilgan imkoniyatlar kiradi. Qoʻshimcha narsalar alohida, kelishilgan narxda qoʻshiladi.', 5),
  ('pricing', 'Maktablar uchun narx nega koʻrsatilmagan?', 'Maktab hajmi, oʻquvchilar soni va kerakli modullar har xil. Shuning uchun demo koʻrsatib, soʻng aniq narx aytamiz.', 6),
  ('pricing', 'Avval toʻlov kerakmi?', 'Odatda ishni boshlash uchun kelishilgan qismi oldindan toʻlanadi, qolgani topshirishda. Shartlar muzokarada aniqlanadi.', 7),
  ('pricing', 'Paketni keyinroq kengaytirsa boʻladimi?', 'Ha. Keyinroq yuqoriroq paketga oʻtish yoki qoʻshimcha xizmat olish mumkin.', 8);

insert into public.testimonials (author, role, text, published, sort_order) values
  ('[Ism Familiya]', '[Lavozim, tashkilot]', '[Haqiqiy mijoz fikri shu yerga qoʻyiladi. Soxta fikr yozmang.]', false, 0),
  ('[Ism Familiya]', '[Lavozim, tashkilot]', '[Haqiqiy mijoz fikri shu yerga qoʻyiladi.]', false, 1),
  ('[Ism Familiya]', '[Lavozim, tashkilot]', '[Haqiqiy mijoz fikri shu yerga qoʻyiladi.]', false, 2);

insert into public.posts (slug, title, description, body, date) values
  ('biznes-uchun-telegram-bot', 'Biznes uchun Telegram bot: qachon kerak?', 'Telegram bot qaysi bizneslarga foyda keltiradi va uni yaratishdan oldin nimalarni oʻylab koʻrish kerak.', 'Oʻzbekistonda mijozlarning koʻpchiligi Telegramdan foydalanadi. Shuning uchun **Telegram bot** kichik va oʻrta biznes uchun eng tez foyda beradigan vositalardan biri.

## Bot qachon kerak?

- Bir xil savollarga kuniga oʻnlab marta javob berayotgan boʻlsangiz
- Buyurtmani tunda ham qabul qilmoqchi boʻlsangiz
- Mijozlarga eslatma yoki yangiliklarni avtomatik yuborish kerak boʻlsa

## Yaratishdan oldin

1. Botning **bitta asosiy vazifasini** aniqlang.
2. Mijoz qaysi savollarni koʻp beradi, roʻyxat qiling.
3. Buyurtma kimga va qanday yetib borishini belgilang.

Oddiy botdan boshlab, keyin kengaytirish eng yaxshi yoʻl.', '2026-10-10'::date),
  ('maktab-erp-nima', 'Maktab ERP nima va u maktabga nima beradi?', 'Maktab ERP tizimi nima, qanday muammolarni hal qiladi va uni tanlashda nimalarga eʼtibor berish kerak.', '**Maktab ERP** bu maktabning kundalik ishlarini bitta tizimga jamlaydigan dastur: davomat, baholar, dars jadvali, ota-onalar bilan aloqa va hisobotlar.

## Qanday muammolarni hal qiladi?

- Qogʻoz jurnallar va Excel fayllarning chalkashligi
- Ota-onalarning bola haqida kech xabar topishi
- Hisobot tayyorlashga ketadigan koʻp vaqt
- Dars jadvalidagi toʻqnashuvlar

## Tanlashda nimaga eʼtibor berish kerak?

1. Oʻqituvchi uchun qulaylik: tizim murakkab boʻlsa, undan foydalanilmaydi.
2. Telefonda ishlashi.
3. Maʼlumotlar xavfsizligi va zaxira nusxasi.
4. Ishga tushgandan keyingi yordam.

> Eng yaxshi tizim bu oʻqituvchilar haqiqatan foydalanadigan tizimdir.

Maktabingiz uchun demo koʻrishni xohlasangiz, biz bilan bogʻlaning.', '2026-10-01'::date);

commit;
