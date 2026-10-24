// Biznes tahlili: ma'lumotlar va matnlar. Bu TAXMINIY tavsiya tizimi (qoidalar asosida), shuning uchun
// yechimlar va muddatlar boshlang'ich yo'nalish; aniq vazifa va narx muzokarada belgilanadi.
export type Tier = 'start' | 'pro' | 'maktab_biznes'
export type Size = 'solo' | 'mid' | 'large'

export interface BusinessType {
  id: string
  label: string
  hint: string
}
export interface Pain {
  id: string
  label: string
  /** Qaysi biznes turlariga mos ('all' = hammasiga) */
  types: string[] | 'all'
  solutions: string[]
}
export interface Solution {
  id: string
  title: string
  summary: string
  features: string[]
  service: 'website' | 'erp' | 'timetable' | 'bot' | 'ai' | 'content' | 'other'
  weeks: [number, number]
  tier: Tier
  note?: string
}

export const businessTypes: BusinessType[] = [
  { id: 'savdo', label: 'Doʻkon / savdo', hint: 'Oflayn yoki onlayn savdo' },
  { id: 'ovqat', label: 'Restoran / kafe', hint: 'Ovqatlanish va yetkazib berish' },
  { id: 'xizmat', label: 'Xizmat koʻrsatish', hint: 'Salon, klinika, ustaxona, markaz' },
  { id: 'maktab', label: 'Maktab / oʻquv markazi', hint: 'Taʼlim muassasasi' },
  { id: 'ishlab', label: 'Ishlab chiqarish / ulgurji', hint: 'Sex, ombor, yetkazib berish' },
  { id: 'onlayn', label: 'Startap / onlayn xizmat', hint: 'Raqamli mahsulot yoki xizmat' },
  { id: 'boshqa', label: 'Boshqa', hint: 'Yuqoridagilarga kirmaydi' },
]

export const sizes: { id: Size; label: string; hint: string }[] = [
  { id: 'solo', label: '1–5 kishi', hint: 'Kichik jamoa' },
  { id: 'mid', label: '6–20 kishi', hint: 'Oʻrta' },
  { id: 'large', label: '20 dan ortiq', hint: 'Katta tashkilot' },
]

export const pains: Pain[] = [
  { id: 'no_site', label: 'Saytim yoʻq yoki eskirgan, mijozlar meni internetda topa olmaydi', types: 'all', solutions: ['site_vizitka'] },
  { id: 'lead_loss', label: 'Qiziqqan odamlar ariza qoldirmay ketib qoladi', types: 'all', solutions: ['landing_form', 'mini_crm'] },
  { id: 'slow_replies', label: 'Bir xil savollarga javob berishga koʻp vaqt ketadi', types: 'all', solutions: ['faq_bot', 'ai_agent'] },
  { id: 'manual_orders', label: 'Buyurtmalarni qoʻlda yozib boraman, adashib ketadi', types: ['savdo', 'ovqat', 'xizmat', 'ishlab', 'onlayn'], solutions: ['order_bot', 'order_system'] },
  { id: 'no_online_payment', label: 'Mijozlar onlayn toʻlay olmaydi', types: ['savdo', 'ovqat', 'xizmat', 'maktab', 'onlayn'], solutions: ['webshop_pay'] },
  { id: 'excel_chaos', label: 'Mijozlar va hisobotlar daftar yoki Excelda, tartib yoʻq', types: 'all', solutions: ['mini_crm'] },
  { id: 'no_followup', label: 'Mijozga eslatma yuborishni unutaman, qayta kelmay qoladi', types: 'all', solutions: ['reminders_bot', 'mini_crm'] },
  { id: 'ad_blind', label: 'Reklamaga pul sarflayman, lekin natijasini bilmayman', types: 'all', solutions: ['landing_analytics', 'landing_form'] },
  { id: 'bookings', label: 'Navbat va band vaqtlarni telefonda yuritaman, chalkashadi', types: ['xizmat', 'maktab', 'ovqat'], solutions: ['booking_system', 'reminders_bot'] },
  { id: 'staff_control', label: 'Xodimlar ishini nazorat qilish va hisobot olish qiyin', types: 'all', solutions: ['staff_dashboard'] },
  { id: 'inventory', label: 'Ombor va tovar hisobi tartibsiz, tovar tugab qoladi', types: ['savdo', 'ovqat', 'ishlab'], solutions: ['inventory_system'] },
  { id: 'repeat_tasks', label: 'Har kuni takrorlanadigan qoʻlda ishlar koʻp', types: 'all', solutions: ['automation'] },
  { id: 'school_attendance', label: 'Davomat va baholar qogʻozda, ota-onalar kech xabar topadi', types: ['maktab'], solutions: ['school_erp'] },
  { id: 'school_timetable', label: 'Dars jadvalini qoʻlda tuzish haftalar oladi', types: ['maktab'], solutions: ['timetable'] },
  { id: 'teacher_content', label: 'Oʻqituvchilar dars materiallarini tayyorlashga koʻp vaqt sarflaydi', types: ['maktab'], solutions: ['content_pack'] },
]

export const solutions: Solution[] = [
  {
    id: 'site_vizitka', title: 'Zamonaviy sayt (vizitka)', service: 'website', weeks: [1, 2], tier: 'start',
    summary: 'Mijozlar sizni Google va Telegramdan topadi, xizmat va narxlarni bir joyda koʻradi.',
    features: ['Telefonga moslashgan dizayn', 'Xizmatlar, narxlar va aloqa sahifalari', 'Ariza formasi va Telegram bildirishnomasi', 'Google uchun (SEO) asosiy sozlamalar'],
  },
  {
    id: 'landing_form', title: 'Ariza yigʻuvchi sahifa (landing)', service: 'website', weeks: [1, 1], tier: 'start',
    summary: 'Reklamadan kelgan odam bitta aniq taklifni koʻrib ariza qoldiradi, siz darrov Telegramda xabar olasiz.',
    features: ['Bitta taklifga qaratilgan sahifa', 'Ariza formasi va Telegram xabari', 'Qaysi havoladan kelgani hisobi'],
  },
  {
    id: 'landing_analytics', title: 'Reklama natijasi statistikasi', service: 'website', weeks: [1, 2], tier: 'pro',
    summary: 'Qaysi reklama va manba haqiqatan mijoz keltirayotganini raqamlarda koʻrasiz.',
    features: ['Tashrif va arizalar hisobi', 'Manbalar boʻyicha taqqoslash', 'Qulay boshqaruv paneli'],
  },
  {
    id: 'faq_bot', title: 'Telegram bot: tez-tez soʻraladigan savollar', service: 'bot', weeks: [1, 2], tier: 'start',
    summary: 'Bot bir xil savollarga kechayu kunduz javob beradi, murakkab savolni sizga uzatadi.',
    features: ['Narx, manzil, ish vaqti kabi savollarga avtomatik javob', 'Murakkab savolni sizga yoʻnaltirish', 'Mijozlar roʻyxatini yigʻish'],
  },
  {
    id: 'ai_agent', title: 'AI yordamchi (agent)', service: 'ai', weeks: [2, 4], tier: 'pro',
    summary: 'Mijozning savolini tushunib, sizning maʼlumotlaringiz asosida javob beradi va buyurtma qabul qila oladi.',
    features: ['Erkin matn bilan savol-javob', 'Katalog va narxlar asosida javob', 'Murakkab holatda sizga yoʻnaltirish'],
    note: 'Aniq imkoniyat maʼlumotlaringiz sifatiga bogʻliq.',
  },
  {
    id: 'order_bot', title: 'Buyurtma qabul qiluvchi bot', service: 'bot', weeks: [1, 3], tier: 'pro',
    summary: 'Mijoz botda tanlaydi, buyurtma tayyor holda sizga keladi, qoʻlda yozish va adashish yoʻqoladi.',
    features: ['Mijoz tanlaydi, bot buyurtmani yigʻadi', 'Tayyor buyurtma Telegramda keladi', 'Holatni mijozga xabar qilish'],
  },
  {
    id: 'order_system', title: 'Buyurtmalar boshqaruv paneli', service: 'website', weeks: [2, 4], tier: 'pro',
    summary: 'Barcha buyurtmalar bir joyda, holati va tarixi bilan; xodimlar bir xil maʼlumot bilan ishlaydi.',
    features: ['Buyurtmalar roʻyxati va holatlari', 'Qidiruv, filtr, Excelga yuklash', 'Xodimlar uchun rollar'],
  },
  {
    id: 'webshop_pay', title: 'Onlayn doʻkon va toʻlov', service: 'website', weeks: [3, 6], tier: 'pro',
    summary: 'Mijoz saytdan tanlab, onlayn toʻlaydi; siz buyurtma va toʻlovni bir joyda koʻrasiz.',
    features: ['Katalog va savat', 'Click/Payme orqali onlayn toʻlov', 'Buyurtma va toʻlov hisoboti'],
    note: 'Onlayn toʻlov uchun toʻlov tizimi bilan shartnoma (merchant) kerak.',
  },
  {
    id: 'mini_crm', title: 'Mijozlar bazasi (mini CRM)', service: 'website', weeks: [2, 4], tier: 'pro',
    summary: 'Har bir mijoz kartasi: aloqa maʼlumoti, tarix, izohlar va qayta bogʻlanish eslatmalari.',
    features: ['Mijoz kartasi va tarixi', 'Qayta qoʻngʻiroq eslatmalari', 'Excel import va eksport'],
  },
  {
    id: 'reminders_bot', title: 'Eslatma va xabarnoma tizimi', service: 'bot', weeks: [1, 2], tier: 'start',
    summary: 'Navbat, toʻlov yoki tadbir haqida mijozga avtomatik eslatma ketadi; qaytmaganlarga taklif yuboriladi.',
    features: ['Telegram orqali avtomatik eslatma', 'Navbat va toʻlov muddati haqida xabar', 'Qaytib kelmaganlarga taklif'],
  },
  {
    id: 'booking_system', title: 'Onlayn navbat / band qilish', service: 'website', weeks: [2, 4], tier: 'pro',
    summary: 'Mijoz boʻsh vaqtni oʻzi tanlaydi, band vaqtlar toʻqnashmaydi, telefonda vaqt ketmaydi.',
    features: ['Boʻsh vaqtni mijozning oʻzi tanlaydi', 'Toʻqnashuvlarni oldini olish', 'Eslatma va bekor qilish'],
  },
  {
    id: 'staff_dashboard', title: 'Xodimlar va hisobot paneli', service: 'website', weeks: [3, 6], tier: 'maktab_biznes',
    summary: 'Vazifalar, natijalar va hisobotlar bir joyda; kim nima qilgani aniq koʻrinadi.',
    features: ['Vazifalar va natijalar', 'Kunlik va haftalik hisobot', 'Rollar va ruxsatlar'],
  },
  {
    id: 'inventory_system', title: 'Ombor va zaxira hisobi', service: 'website', weeks: [3, 6], tier: 'pro',
    summary: 'Kirim-chiqim aniq yuritiladi, tovar tugashidan oldin ogohlantirish keladi.',
    features: ['Kirim-chiqim hisobi', 'Tovar tugashi haqida ogohlantirish', 'Hisobot va Excelga yuklash'],
  },
  {
    id: 'automation', title: 'Takroriy ishlarni avtomatlashtirish', service: 'other', weeks: [1, 3], tier: 'pro',
    summary: 'Har kuni qoʻlda qilinadigan hisobot, xabar yoki jadval ishlari avtomatik bajariladi.',
    features: ['Qoʻlda qilinadigan ishlarni aniqlash', 'Hisobot va xabarlarni avtomatlashtirish', 'Mavjud tizimlar bilan ulash'],
    note: 'Qaysi ishlarni avtomatlashtirish mumkinligi suhbatda aniqlanadi.',
  },
  {
    id: 'school_erp', title: 'Maktab boshqaruv tizimi (ERP)', service: 'erp', weeks: [4, 8], tier: 'maktab_biznes',
    summary: 'Davomat, baholar va ota-onalar bilan aloqa elektron tizimda; hisobotlar tayyor.',
    features: ['Davomat va baholar', 'Ota-onalar kabineti', 'Hisobotlar va statistika'],
  },
  {
    id: 'timetable', title: 'Avtomatik dars jadvali', service: 'timetable', weeks: [2, 4], tier: 'pro',
    summary: 'Oʻqituvchi va xona cheklovlariga qarab jadval avtomatik tuziladi, toʻqnashuvlar koʻrsatiladi.',
    features: ['Cheklovlarni hisobga olish', 'Toʻqnashuvlarni koʻrsatish', 'Qoʻlda tuzatish imkoniyati'],
  },
  {
    id: 'content_pack', title: 'Tayyor dars materiallari', service: 'content', weeks: [1, 2], tier: 'start',
    summary: 'Mavzular boʻyicha taqdimot, shablon va ishchi varaqlar: oʻqituvchining vaqti tejaladi.',
    features: ['Mavzular boʻyicha taqdimotlar', 'Shablon va ishchi varaqlar', 'Buyurtma asosida tayyorlash'],
  },
]

export const ui = {
  seoTitle: 'Bepul biznes tahlili',
  seoDescription: "Biznesingizdagi og'riqli nuqtalarni belgilang, taxminiy yechim va muddatni oling, yoqsa shuni tayyorlab berishimizni so'rang.",
  title: 'Biznesingizdagi muammoni toping, yechimni koʻring',
  subtitle: "3 ta qisqa savol. Natijada taxminiy yechimlar, muddat va mos paketni olasiz. Bu bepul va majburiyatsiz.",
  step: 'Qadam',
  of: 'dan',
  s1: 'Biznesingiz turi qanday?',
  s2: "Qaysi muammolar sizga tanish? (bir nechtasini belgilashingiz mumkin)",
  s3: 'Jamoangiz qancha?',
  noteLabel: "Boshqa muammo yoki qo'shimcha (ixtiyoriy)",
  notePlaceholder: "Masalan: 'filiallar o'rtasida hisobot yig'ish qiyin...'",
  next: 'Davom etish',
  back: 'Orqaga',
  seeResult: 'Natijani koʻrish',
  pickOne: 'Bittasini tanlang',
  pickPain: 'Kamida bitta muammoni belgilang',
  resultTitle: 'Taxminiy yechimlar sizning biznesingiz uchun',
  resultIntro: "Tanlovingizga ko'ra eng mos yo'nalishlar. Bu taxminiy tavsiya: aniq vazifa va narx suhbatda belgilanadi.",
  because: 'Hal qiladi',
  weeks: 'taxminiy muddat',
  weekShort: 'hafta',
  firstStage: 'Boshlash uchun eng muhimi',
  recommendedPackage: 'Mos paket',
  packageNames: { start: 'Start', pro: 'Pro', maktab_biznes: 'Korporativ' } as Record<string, string>,
  order: 'Shuni tayyorlab bering',
  orderHint: "Buyurtma formasi tanlovingiz bilan to'ldirilgan holda ochiladi.",
  seePricing: "Paketlarni ko'rish",
  restart: 'Qaytadan boshlash',
  disclaimer: "Bu tavsiya qoidalar asosida tuzilgan taxminiy yo'nalish. Haqiqiy yechim, muddat va narx sizning ehtiyojingizni aniqlagandan keyin kelishiladi.",
}
