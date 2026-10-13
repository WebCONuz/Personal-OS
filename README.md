# Personal OS

Shaxsiy rivojlanish platformasi: **maqsad → haftalik reja → kundalik harakat → natija → tahlil → keyingi reja**.
Backend yo‘q: barcha ma’lumotlar brauzerning `localStorage` xotirasida saqlanadi, JSON eksport/import orqali zaxiralanadi.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # Vitest (unit + komponent testlari)
npm run lint       # oxlint
npm run build      # tsc -b + vite build → dist/
npm run preview    # build natijasini ko‘rish
```

Talablar: Node.js 20+ (Node 25 bilan sinovdan o‘tgan).

### Statik hostingga joylash

`dist/` papkasini istalgan statik hostingga qo‘yish mumkin. Ilova `BrowserRouter` ishlatadi, shuning uchun
barcha yo‘llar `index.html`ga yo‘naltirilishi kerak (Netlify uchun `public/_redirects` tayyor; Vercel/Nginx’da
SPA fallback sozlanadi). Hostingga joylash ma’lumotlarni qurilmalar o‘rtasida **sinxronlamaydi**.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · shadcn/ui (Radix) · React Router 8 · Zustand 5 ·
React Hook Form + Zod 4 · Recharts 3 · date-fns 4 · lucide-react · Vitest + Testing Library.

## Arxitektura (feature-based)

```text
src/
  app/            # ilova qatlami: router, layoutlar (sidebar, top bar, drawer), navigatsiya konfiguratsiyasi
  components/
    ui/           # shadcn/ui komponentlari
    shared/       # PageHeader, EmptyState, SectionCard, ConfirmDialog, ProgressBar, …
    forms/        # FormField, FormDialog, entity select’lar, zod form helperlari
    charts/       # Recharts wrapperlari (tooltip + ekran o‘quvchi uchun jadval)
  features/<feature>/
    components/   # sahifalar va feature UI
    service.ts    # domen amallari (UI faqat shu orqali yozadi)
    schemas.ts    # forma validatsiyasi (kerak bo‘lsa)
    editor.ts     # forma dialogini istalgan joydan ochish uchun store
    hooks.ts      # derived data hook’lari (kerak bo‘lsa)
  services/       # sof domen logikasi: date, money, progress, gamification, analytics, backup
  data/
    schema/       # Zod entity sxemalari + DbState (yagona manba)
    storage/      # StorageAdapter (localStorage / memory), load + atomik yozish + recovery
    repositories/ # umumiy CRUD repository (getAll/getById/create/update/remove)
    migrations/   # schemaVersion va migratsiya funksiyalari
    seed/         # standart hayot sohalari va demo ma’lumotlar
    relations.ts  # cascade / unlink qoidalari (o‘chirish va import uchun)
    store.ts      # Zustand store: avval saqlaydi, keyin UI holatini yangilaydi
  constants/      # markaziy label’lar (kelajakdagi i18n uchun bitta joy)
  hooks/          # umumiy hook’lar (useCollection, useToday, …)
  types/          # Zod’dan chiqarilgan TypeScript turlari
```

**Qoidalar:** komponentlar `localStorage`ga to‘g‘ridan-to‘g‘ri murojaat qilmaydi (service → repository/mutate →
store → adapter). Statistika (progress, foizlar, XP, streak, budjet holati, insight’lar) saqlanmaydi — har safar
asosiy yozuvlardan hisoblanadi. Bir nechta to‘plamni o‘zgartiradigan amallar atomik: biror kalitni yozish
muvaffaqiyatsiz bo‘lsa, yozilganlari orqaga qaytariladi va UI holati o‘zgarmaydi.

## Nimalar ishlaydi

| Bo‘lim | Imkoniyatlar |
|---|---|
| Onboarding | Bo‘sh ish maydoni yoki demo ma’lumotlar; ism |
| Dashboard | Salomlashuv, bugungi 3 ta vazifa, haftalik progress va ustuvorliklar, faol maqsadlar, XP/daraja/streak, vaqt taqsimoti, oylik moliya (valyuta bo‘yicha), odatlar va challenge, insight’lar, review CTA, “Boshlash” checklist |
| Maqsadlar | CRUD, 4 xil o‘lchov (bajarildi, foiz, sonli, bosqichlar), ota/bola maqsad, bosqichlar, progress tarixi + grafik, bog‘langan vazifa/loyihalar, filtr (holat/soha/muddat), karta va ro‘yxat ko‘rinishi |
| Rejalashtirish | Haftalik reja (holatlar: qoralama → faol → yakunlangan; 3–5 ustuvor natija, sig‘im va buffer, ortiqcha reja ogohlantirishi, kunlarga taqsimlash, challenge), “Bugun” sahifasi va kun yakuni, vazifalar (Inbox, rejalashtirilmagan, bugun, muddati o‘tgan, qidiruv, filtr, saralash), vaqt kuzatuvi (taymer + qo‘lda), haftalik review |
| Karyera | Ko‘nikmalar matritsasi, o‘rganish yo‘nalishlari (daraja farqi, reja, bog‘langan resurslar, vaqt, dalillar), yutuqlar timeline’i, ish arizalari pipeline’i, intervyu qaydlari |
| Biznes va loyihalar | Umumiy loyiha modeli (biznes/portfolio/ilmiy/shaxsiy), progress vazifalardan, “keyingi eng kichik qadam”, g‘oyalar kanbani va baholash, g‘oyani loyihaga aylantirish, mijozlar ro‘yxati, parallel loyihalar ogohlantirishi |
| Ta’lim va bilim | O‘quv resurslari (rejalashtirilgan mashg‘ulotlar — resursga bog‘langan vazifalar, sarflangan vaqt, ko‘nikma, amaliy natija), bilimlar bazasi (teglar, qidiruv, xavfsiz Markdown), ingliz tili iboralari va mashq logi, ilmiy ish loyihalari |
| Moliya | Daromad/xarajat CRUD, UZS/USD alohida, oylik va 6 oylik grafiklar, kategoriyalar, budjet limitlari, jamg‘arma maqsadlari (hissa yozuvlari yagona manba), CSV eksport |
| Hayot tarzi | Odatlar (kunlik/haftalik target, haftalik jadval, streak qoidasi), salomatlik ko‘rsatkichlari, oila: muhim sanalar (har yili), rejalar, vazifalar |
| Statistika | 8 haftalik trendlar, sohalar bo‘yicha vaqt, odatlar, maqsadlar, oylik moliya jadvali, streak tarixi (30 kun, eng uzun streak), XP tarixi, nishonlar, qoidaga asoslangan insight’lar |
| Sozlamalar | Profil, haftalik sig‘im, gamifikatsiyani o‘chirish, hayot sohalarini yashirish/nomlash, JSON eksport, preview’li import (birlashtirish/almashtirish), demo yuklash/tozalash, zaxira nusxalar, reset, maxfiylik eslatmasi |
| Global | Ctrl/⌘+K qidiruv (natija o‘z sahifasida tahrirlash oynasi bilan ochiladi), tezkor qo‘shish menyusi (vazifa, maqsad, qayd, xarajat), ishlayotgan taymer indikatori, saqlash holati |

### Muhim domen qoidalari

- Haftalik bajarilish foizi faqat shu haftaga rejalashtirilgan vazifalardan, **bekor qilinganlarsiz** hisoblanadi.
- XP faqat **birinchi** yakunlashda beriladi (vazifa, odat kuni, bosqich, maqsad, review, challenge). Qayta ochish XP tarixini o‘chirmaydi, qayta bajarish ikkinchi marta XP bermaydi. Miqdorlar: `src/services/gamification/config.ts`.
- Daraja: `L` darajaga yetish uchun `100 · L · (L−1) / 2` XP (0, 100, 300, 600, 1000…).
- Streak: kamida bitta vazifa yoki odat bajarilgan ketma-ket kunlar; bugun hali belgilanmagan bo‘lsa streak buzilmaydi.
- Bajarilmagan vazifalar keyingi haftaga **avtomatik ko‘chmaydi** — faqat foydalanuvchi tasdig‘i bilan.
- UZS va USD hech qachon qo‘shilmaydi (kurs xizmati yo‘q).
- Taymer vaqti `startedAt`dan hisoblanadi; bir vaqtda bitta taymer, yangisi boshlansa eskisi saqlanadi.
- Sana-only qiymatlar `YYYY-MM-DD` ko‘rinishida saqlanadi va lokal vaqtda parse qilinadi (kun siljimaydi); hafta dushanbadan boshlanadi.

### Ma’lumotlar xavfsizligi

- Har bir to‘plam alohida versiyalangan kalitda (`personal-os:*`), `personal-os:meta`da `schemaVersion`.
- Buzilgan JSON yoki noto‘g‘ri yozuvlar yuklanishda aniqlanadi: asl nusxa `personal-os:recovery:*` ga ko‘chiriladi, yaroqli yozuvlar saqlanib qoladi, foydalanuvchiga banner ko‘rsatiladi.
- Yangiroq versiyadagi ma’lumotlar topilsa yozish bloklanadi (ma’lumot ustidan yozilmaydi).
- Import: JSON parse → ilova/versiya tekshiruvi → migratsiya → Zod validatsiya → takroriy ID → osilgan bog‘lanishlarni tuzatish → preview → tasdiq. Xato bo‘lsa mavjud ma’lumotlar o‘zgarmaydi.

## Testlar

`npm run test` — 14 ta fayl, 84 ta test:

- **Domen:** sana/hafta hisoblari, valyuta formati va ajratish, progress, daraja va XP qoidalari, streak’lar va
  streak tarixi, cascade/unlink, atomik yozish va rollback, buzilgan JSON, migratsiya bloki, demo ma’lumotlar
  validatsiyasi va tozalanishi, eksport/import, vazifa/odat/taymer/jamg‘arma/haftalik reja servislari.
- **Komponentlar** (Testing Library + `axe-core`): Vazifalar, Maqsadlar (forma validatsiyasi), Haftalik reja
  (holatlar, ortiqcha reja), Odatlar, Sozlamalar (import), global qidiruv.

### Accessibility

Barcha 30 ta sahifa, formalar va dialoglar brauzerda `axe-core` bilan tekshirilgan (kontrast, label’lar, ARIA,
sarlavhalar tartibi) — buzilish yo‘q. Yagona qolgan izoh: ochiq dropdown menyular portal orqali landmark’dan
tashqarida render qilinadi (`region`, best-practice darajasi); menyu `role="menu"` bilan to‘g‘ri e’lon qilingan.
Layout 360px, 375px, ~800px va 1440px kengliklarda tekshirilgan, gorizontal scroll yo‘q.

## Keyingi bosqichga qoldirilgan

- Qorong‘i rejim (tokenlar tayyor, `profile.theme` maydoni bor) va ko‘p tillilik (label’lar `src/constants/labels.ts`da markazlashgan, komponent matnlari hali ichida).
- Takrorlanuvchi vazifalar (to‘liq implementatsiyasiz saqlanmaydi).
- Drag-and-drop (hozir kun/holat tanlovlari select orqali — klaviatura bilan ham ishlaydi).
- IndexedDB adapteri (StorageAdapter interfeysi tayyor).
- Bilimlar bazasida backlink grafi, murakkab editor.

## Ma’lum cheklovlar

- Ma’lumotlar faqat joriy brauzer profilida; qurilmalar o‘rtasida sinxronlash yo‘q. Muntazam JSON eksport qiling.
- `localStorage` hajmi odatda ~5 MB; juda katta tarixda IndexedDB’ga o‘tish kerak bo‘ladi.
- `localStorage` shifrlanmagan — parol yoki bank rekvizitlarini kiritmang.
