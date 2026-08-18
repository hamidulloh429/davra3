# DAVRA v2.0 — Professional Community Platform

> **"YOUR COMMUNITY. YOUR DAVRA."**

Davra v2.0 — foydalanuvchilar va jamoalar uchun zamonaviy, xavfsiz va production-ready hamjamiyat platformasi. Platforma **Supabase (PostgreSQL, Auth, Realtime, Storage)** va **React 19 + Vite 8** asosida to'liq qayta ishlab chiqildi.

---

## 1. Asosiy O'zgarishlar va Arxitektura (v2.0)

- **Express Server Olib Tashlandi:** Server infra-strukturasi va Express API o'rniga Supabase Cloud (PostgreSQL ma'lumotlar bazasi, Supabase Auth, Supabase Realtime hamda Supabase Storage) ishlatildi.
- **Faqat Google OAuth Kirish:** Oddiy foydalanuvchilar uchun parol bilan ro'yxatdan o'tish olib tashlanib, bir klikli Google OAuth yo'lga qo'yildi. Birinchi kirganda noyob `username` tanlash oynasi chiqadi.
- **Admin 2-Faktorli Autentifikatsiya:** Admin paneli Google identity + Admin login/parol (2FA) orqali himoyalangan. Dastlabki Super Admin emaili: `hamidulloh429@gmail.com`.
- **Web3 Startup Estetikasi:** Royal Blue (`#123CCF`), Neon Green (`#B7FF00`), Glassmorphism, CSS 3D floating avatarlar va yengil parallax animatsiyalar.
- **Supabase Realtime Chat:** Har bir davrada real vaqt rejimida text, rasm va video yuborish imkoniyati.
- **To'liq Admin Paneli:** 8 ta metrika kartalari, foydalanuvchilarni bloklash (sababi bilan), davralar va adminlarni boshqarish, audit loglar, moderatsiya reports va maintenance mode.

---

## 2. Loyiha Tuzilishi (Project Structure)

```text
davra/
├── client/                     # React 19 + Vite 8 frontend
│   ├── public/
│   │   ├── favicon.svg          # Neon green 'D' logotipi
│   │   ├── manifest.json        # PWA manifest
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, Footer, CircleCard, Modal, NotificationBell, etc.)
│   │   ├── contexts/           # AuthContext (Google OAuth), AdminAuthContext (2FA), ToastContext
│   │   ├── hooks/              # useRealtimeChat, useNotifications, useParallax
│   │   ├── layouts/            # MainLayout (User), AdminLayout (Admin)
│   │   ├── lib/                # supabase.js client, utils.js
│   │   ├── pages/              # User va Admin sahifalari
│   │   │   ├── admin/          # Admin Dashboard, Users, Communities, Admins, Settings, Logs, Reports, Media, Profile
│   │   │   ├── HomePage.jsx
│   │   │   ├── CommunitiesPage.jsx
│   │   │   ├── CommunityDetailPage.jsx
│   │   │   ├── CreateCommunityPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── NotificationsPage.jsx
│   │   ├── styles/             # variables.css (design tokens), global.css, animations.css
│   │   ├── App.jsx             # Barcha yo'riqnomalar (Routes)
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # 20 ta PostgreSQL jadvali va indekslar
│       ├── 002_rls_policies.sql    # Row Level Security (RLS) qoidalari
│       └── 003_functions.sql       # RPC statistikalar va triggerlar
├── .env.example
├── vercel.json                 # Vercel SPA routing sozlamasi
├── package.json
└── README.md
```

---

## 3. O'rnatish va Ishga Tushirish (Installation & Setup)

### 3.1 Bog'liqliklarni o'rnatish
```bash
npm run install:all
```

### 3.2 Muhit O'zgaruvchilari (.env)
`client` papkasida yoki ildizda `.env` faylini yarating va Supabase ma'lumotlarini kiriting:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SITE_URL=http://localhost:5173
```

---

## 4. Supabase Sozlash Qo'llanmasi

1. [Supabase Console](https://database.new) sahifasida yangi loyiha yarating.
2. **SQL Editor** bo'limiga o'ting va quyidagi migratsiya fayllarini ketma-ket bajaring:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`
3. **Storage** bo'limida quyidagi bucketlarni yarating va ularni **Public** qilib belgilang:
   - `avatars` (Foydalanuvchilar va adminlar avatarlari uchun)
   - `circle-covers` (Davralar muqova rasmlari uchun)
   - `chat-media` (Chatdagi rasm va videolar uchun)
4. **Authentication** → **Providers** bo'limidan **Google** ni yoqing.
   - Google Cloud Console yordamida `Client ID` va `Client Secret` kiriting.
   - Authorized Redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

---

## 5. Mahalliy Ishga Tushirish (Local Development)

```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Admin Panel:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

Dastlabki Super Admin emaili: `hamidulloh429@gmail.com`. Ushbu Google hisobi bilan kirganingizda avtomatik ravishda Super Admin huquqi beriladi va 2-bosqichli admin login/parol yaratish taklif etiladi.

---

## 6. Vercel-da Bepul Joylashtirish (Deployment)

1. Loyihani GitHub-ga yuklang.
2. [Vercel Console](https://vercel.com/new) sahifasiga o'ting.
3. Framework Preset: **Vite**
4. Root Directory: `client`
5. Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL` = `https://your-app.vercel.app`
6. Deploy tugmasini bosing!
