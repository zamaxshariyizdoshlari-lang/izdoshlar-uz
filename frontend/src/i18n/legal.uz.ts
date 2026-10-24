// Huquqiy matnlar. DIQQAT: bu NAMUNA shablon. Eʼlon qilishdan oldin yurist koʻrigidan oʻtkazing
// va [qavs ichidagi] joylarni toʻldiring. Rekvizitlar (.env dagi VITE_LEGAL_*) avtomatik qoʻyiladi.
//
// Matnda ishlatiladigan belgilar: {brand} {legalName} {inn} {address} {email} {phone} {telegram} {site}

export interface LegalSection {
  h: string
  p: string[]
}
export interface LegalDoc {
  title: string
  description: string
  updated: string
  sections: LegalSection[]
}

export const privacy: LegalDoc = {
  title: 'Maxfiylik siyosati',
  description: 'Saytda yigʻiladigan shaxsiy maʼlumotlar, ulardan foydalanish maqsadi va sizning huquqlaringiz.',
  updated: '2026-yil 23-oktabr',
  sections: [
    {
      h: '1. Umumiy qoidalar',
      p: [
        'Ushbu siyosat {site} saytida ({brand}) shaxsiy maʼlumotlar qanday yigʻilishi, saqlanishi va ishlatilishini tushuntiradi. U Oʻzbekiston Respublikasining «Shaxsga doir maʼlumotlar toʻgʻrisida»gi qonuniga muvofiq tuzilgan.',
        'Maʼlumotlar operatori: {legalName}, STIR (INN): {inn}, manzil: {address}.',
      ],
    },
    {
      h: '2. Qanday maʼlumotlarni yigʻamiz',
      p: [
        'Buyurtma yoki demo soʻrovi formasida siz oʻzingiz kiritgan maʼlumotlar: ism, telefon raqami, Telegram nomi, loyiha tavsifi, ixtiyoriy fayl havolasi, byudjet va xizmat turi. Maktablar uchun qoʻshimcha ravishda maktab nomi, oʻquvchilar soni va hozirgi tizim.',
        'Texnik maʼlumotlar: spamdan himoya qilish uchun IP manzil faqat qaytarib boʻlmaydigan (xeshlangan) koʻrinishda saqlanadi. Soʻrov yuborilgan sahifa manzili ham yoziladi.',
        'Biz maxsus toifadagi maʼlumotlarni (sogʻliq, diniy eʼtiqod va hokazo) soʻramaymiz. Iltimos, formaga bunday maʼlumot yozmang.',
      ],
    },
    {
      h: '3. Maʼlumotlardan foydalanish maqsadi',
      p: [
        'Soʻrovingizga javob berish, siz bilan bogʻlanish, xizmat narxi va shartlarini kelishish, kelishilgan xizmatni koʻrsatish hamda spam va suiisteʼmolga qarshi himoya.',
        'Maʼlumotlaringiz reklama maqsadida uchinchi shaxslarga sotilmaydi va berilmaydi.',
      ],
    },
    {
      h: '4. Huquqiy asos va rozilik',
      p: [
        'Maʼlumotlarni qayta ishlash formadagi «roziman» belgisini qoʻyishingiz bilan berilgan roziligingizga asoslanadi. Rozilik berilgan vaqt buyurtma bilan birga saqlanadi.',
      ],
    },
    {
      h: '5. Saqlash muddati',
      p: [
        'Soʻrov boʻyicha aloqa yakunlangandan keyin maʼlumotlar 12 oygacha saqlanadi. Xizmat koʻrsatilgan boʻlsa, qonunchilikda talab qilingan muddat davomida (hujjatlar va hisob-kitoblar uchun) saqlanishi mumkin. Muddat tugagach, maʼlumotlar oʻchiriladi yoki shaxsni aniqlab boʻlmaydigan holatga keltiriladi.',
      ],
    },
    {
      h: '6. Maʼlumotlarni uzatish',
      p: [
        'Soʻrovingiz haqidagi xabar bizga Telegram (bildirishnoma) va, sozlangan boʻlsa, elektron pochta orqali yetkaziladi. Maʼlumotlar bizning serverimizda (hosting provayderi infratuzilmasida) saqlanadi. Bu xizmat provayderlari maʼlumotlarni faqat xizmatni taʼminlash uchun ishlatadi.',
        'Qonun talab qilgan hollarda maʼlumotlar vakolatli davlat organlariga berilishi mumkin.',
      ],
    },
    {
      h: '7. Xavfsizlik',
      p: [
        'Maʼlumotlarni himoya qilish uchun HTTPS orqali uzatish, serverga kirishni cheklash, parol bilan himoyalangan boshqaruv paneli va zaxira nusxalash kabi tashkiliy va texnik choralar qoʻllanadi. Hech bir tizim 100% himoyalangan deb kafolatlanmaydi.',
      ],
    },
    {
      h: '8. Sizning huquqlaringiz',
      p: [
        'Siz oʻz maʼlumotlaringiz haqida maʼlumot olish, ularni tuzatish yoki oʻchirishni talab qilish, hamda rozilikni istalgan vaqtda qaytarib olish huquqiga egasiz. Buning uchun {email} yoki Telegram ({telegram}) orqali murojaat qiling. Murojaatingizga qonunda belgilangan muddatda javob beramiz.',
      ],
    },
    {
      h: '9. Cookie va brauzer xotirasi',
      p: [
        'Sayt reklama cookie-fayllarini ishlatmaydi va sizni boshqa saytlarda kuzatmaydi. Boshqaruv paneliga kirgan xodim uchun brauzer xotirasida sessiya kaliti saqlanadi.',
        'Anonim statistika: sayt qaysi sahifalar koʻrilgani va qaysi tugmalar bosilganini oʻz serverimizda hisoblaydi (uchinchi tomon xizmatlarisiz, cookie-fayllarsiz). IP manzil saqlanmaydi; tashrif identifikatori har kuni yangilanadigan, qaytarib boʻlmaydigan xesh boʻlib, sizni shaxsan aniqlash imkonini bermaydi. Saqlanadigan maʼlumot: sahifa manzili, manba (masalan, Telegram yoki Google), qurilma turi, brauzer, tizim va taxminiy davlat. Statistika 180 kundan keyin oʻchiriladi. Brauzeringizda «Kuzatma» (Do Not Track) yoqilgan boʻlsa, statistika umuman hisoblanmaydi.',
      ],
    },
    {
      h: '10. Siyosatdagi oʻzgarishlar',
      p: ['Siyosat yangilanishi mumkin. Yangi tahrir shu sahifada eʼlon qilinadi va yuqoridagi sana oʻzgaradi.'],
    },
  ],
}

export const offer: LegalDoc = {
  title: 'Ommaviy oferta (xizmat shartlari)',
  description: 'Raqamli xizmatlar (sayt, ERP, bot, AI agent, kontent) buyurtma qilish shartlari.',
  updated: '2026-yil 23-oktabr',
  sections: [
    {
      h: '1. Umumiy qoidalar',
      p: [
        'Ushbu hujjat {legalName} (STIR: {inn}, keyingi oʻrinlarda «Ijrochi») tomonidan {site} saytida eʼlon qilingan ommaviy oferta hisoblanadi. Buyurtma beruvchi (keyingi oʻrinlarda «Mijoz») buyurtma yuborish va narx hamda shartlarni kelishib, ularni tasdiqlash bilan ushbu shartlarni qabul qilgan hisoblanadi.',
      ],
    },
    {
      h: '2. Xizmat predmeti',
      p: [
        'Ijrochi Mijozga quyidagi xizmatlarni koʻrsatadi: sayt va veb-ilovalar yaratish, maktab boshqaruvi (ERP) va dars jadvali tizimlari, Telegram/Instagram botlar va AI agentlar, taʼlimiy kontent (taqdimot, shablon, video). Aniq hajm, natija va muddat har bir buyurtma boʻyicha alohida kelishiladi.',
        'Saytdagi paketlar (Start, Pro, Korporativ) va qoʻshimcha xizmatlar tavsifi umumiy yoʻnalish hisoblanadi. Yakuniy tarkib kelishuvda belgilanadi.',
      ],
    },
    {
      h: '3. Buyurtma va kelishuv tartibi',
      p: [
        'Mijoz saytdagi forma orqali buyurtma yuboradi. Ijrochi odatda bir ish kuni ichida bogʻlanadi, vazifani aniqlaydi va narx, muddat hamda ish hajmini taklif qiladi.',
        'Ish narx va shartlar Mijoz tomonidan yozma (Telegram yoki elektron pochta orqali) tasdiqlangandan keyin boshlanadi. Forma yuborilishining oʻzi xizmat narxini bildirmaydi va Ijrochini ishni bajarishga majburlamaydi.',
      ],
    },
    {
      h: '4. Narx va toʻlov',
      p: [
        'Xizmat narxi soʻmda, har bir buyurtma uchun alohida kelishiladi. Toʻlov Ijrochining bank kartasiga oʻtkazma orqali amalga oshiriladi. Ishni boshlash uchun oldindan toʻlanadigan ulush va qolgan qismini toʻlash muddati kelishuvda belgilanadi.',
        'Tayyor raqamli mahsulotlar onlayn toʻlov orqali sotilganda, ularning shartlari mahsulot sahifasida alohida koʻrsatiladi.',
      ],
    },
    {
      h: '5. Muddat va topshirish',
      p: [
        'Ish muddati kelishuvda belgilanadi. Mijoz kerakli materiallar (matn, rasm, maʼlumot, kirish huquqlari) va javoblarni oʻz vaqtida taqdim etmasa, muddat shunga mos ravishda surilishi mumkin.',
        'Tayyor natija Mijozga ishga tushirish yoki ochiq havola koʻrinishida topshiriladi. Mijoz natijani koʻrib chiqib, 5 ish kuni ichida eʼtirozlarini bildiradi. Eʼtiroz kelmasa, ish qabul qilingan hisoblanadi.',
      ],
    },
    {
      h: '6. Tuzatishlar va qoʻllab-quvvatlash',
      p: [
        'Kelishilgan texnik topshiriqqa mos kelmaydigan kamchiliklar bepul tuzatiladi. Topshirilgandan keyingi bepul qoʻllab-quvvatlash muddati tanlangan paketga muvofiq belgilanadi (Start: 1 oy, Pro: 3 oy, Korporativ: 6 oy). Bu muddatdan keyin yoki kelishuvdan tashqari yangi talablar alohida narxda bajariladi.',
      ],
    },
    {
      h: '7. Mijozning majburiyatlari',
      p: [
        'Mijoz taqdim etgan matn, rasm, logotip va boshqa materiallar uchinchi shaxslarning huquqlarini buzmasligiga javob beradi. Mijoz kirish maʼlumotlarini (parol, kalitlar) xavfsiz saqlaydi.',
      ],
    },
    {
      h: '8. Intellektual mulk',
      p: [
        'Toʻliq toʻlov amalga oshirilgandan soʻng, Mijozga buyurtma asosida yaratilgan maxsus natijadan foydalanish huquqi beriladi. Ijrochi oldindan mavjud va umumiy (qayta ishlatiladigan) komponent, kutubxona va shablonlar boʻyicha huquqlarni saqlab qoladi. Ochiq kodli kutubxonalar oʻz litsenziyalariga muvofiq ishlatiladi.',
        'Ijrochi, Mijoz alohida rad etmasa, bajarilgan ishni oʻz portfoliosida (nom va umumiy maʼlumotlarsiz yoki kelishilgan holda) koʻrsatishi mumkin.',
      ],
    },
    {
      h: '9. Maxfiylik',
      p: [
        'Tomonlar bir-birining ish jarayonida olingan tijorat va shaxsiy maʼlumotlarini uchinchi shaxslarga oshkor qilmaydi. Shaxsiy maʼlumotlar bilan ishlash tartibi Maxfiylik siyosatida bayon etilgan.',
      ],
    },
    {
      h: '10. Javobgarlik',
      p: [
        'Ijrochining javobgarligi Mijoz tomonidan ushbu buyurtma uchun toʻlangan summa bilan cheklanadi. Ijrochi uchinchi tomon xizmatlari (hosting, domen, Telegram, toʻlov tizimlari) ishidagi uzilishlar uchun javobgar emas. Mijozning oʻz kontenti va undan foydalanish oqibatlari uchun Mijoz javob beradi.',
      ],
    },
    {
      h: '11. Bekor qilish va pulni qaytarish',
      p: [
        'Mijoz ishni istalgan vaqtda toʻxtatishi mumkin. Bu holda bajarilgan ish hajmiga mutanosib qism toʻlanadi, ishga hali kirishilmagan oldindan toʻlov qismi qaytariladi. Aniq shartlar kelishuvda belgilanadi.',
        'Raqamli mahsulot yuklab olingandan keyin, uning mohiyatiga koʻra, pul qaytarilmaydi, mahsulot sahifasida boshqacha koʻrsatilgan boʻlsa tashqari.',
      ],
    },
    {
      h: '12. Nizolarni hal qilish',
      p: [
        'Nizolar avvalo muzokara yoʻli bilan hal qilinadi. Kelishuvga erishilmasa, nizo Oʻzbekiston Respublikasi qonunchiligiga muvofiq vakolatli sudda koʻriladi.',
      ],
    },
    {
      h: '13. Ijrochi rekvizitlari',
      p: [
        '{legalName}. STIR (INN): {inn}. Manzil: {address}. Elektron pochta: {email}. Telefon: {phone}. Telegram: {telegram}.',
      ],
    },
  ],
}
