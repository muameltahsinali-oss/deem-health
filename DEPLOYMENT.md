# دليل نشر موقع ديم هيلث (Deem Health) على Vercel و Railway

يوضح هذا الدليل كيفية رفع الموقع بحيث يكون:
- **الفرونت إند (Frontend)** على **Vercel**
- **الباكيند والتخزين الدائم (Backend & Storage Volume) وقاعدة البيانات** على **Railway**

---

## 1. رفع الباكيند والتخزين على Railway (الخطوة الأولى)

### أ. إنشاء مشروع جديد على Railway
1. اذهب إلى [railway.app](https://railway.app) وسجّل الدخول بحساب GitHub الخاص بك.
2. اضغط على **"New Project"**.
3. اختر **"Deploy from GitHub repo"** واختر مستودع `deem-health`.

### ب. إعداد خدمة الباكيند (Backend Service)
1. في إعدادات الخدمة (Settings):
   - **Root Directory**: اختر `/` (أو اتركها فارغة لأن `railway.json` يشير تلقائياً إلى `backend/Dockerfile`).
2. إضافة قرص التخزين الدائم (**Volume**):
   - اذهب إلى تبويب **"Volumes"** واضغط **"Add Volume"**.
   - حدد مسار التثبيت (Mount Path) إلى: `/app/storage/uploads`
   - هذا يضمن بقاء جميع الصور المرفوعة محفوظة بشكل دائم حتى عند إعادة تشغيل السيرفر.
3. المتغيرات البيئية (Variables):
   - `PORT`: اتركه فارغاً أو 3001 (يقوم Railway بتحديده تلقائياً).
   - `UPLOAD_DIR`: `/app/storage/uploads`
   - `ALLOWED_ORIGIN`: رابط موقعك على Vercel (أو `*`).
4. توليد رابط للخدمة (Generate Domain):
   - اذهب إلى **Networking** واضغط **"Generate Domain"**.
   - انسخ الرابط المولد، مثلاً: `https://deem-backend-production.up.railway.app`.

### ج. إضافة قاعدة بيانات PostgreSQL على Railway (اختياري)
1. في نفس المشروع اضغط **"New"** -> **"Database"** -> **"Add PostgreSQL"**.
2. انسخ `DATABASE_URL` من تبويب المتغيرات لاستخدامه في الباكيند وVercel.

---

## 2. نشر الفرونت إند على Vercel (الخطوة الثانية)

1. اذهب إلى [vercel.com](https://vercel.com) وسجّل الدخول بحساب GitHub.
2. اضغط على **"Add New..."** ثم **"Project"**.
3. استورد مستودع `deem-health`.
4. في خانة **"Environment Variables"** أضف المتغيرات التالية:
   - `RAILWAY_STORAGE_URL`: رابط خدمة الباكيند على Railway (مثال: `https://deem-backend-production.up.railway.app`).
   - `NEXT_PUBLIC_APP_URL`: رابط موقعك على Vercel.
   - `DATABASE_URL`: رابط PostgreSQL من Railway (إذا تم تفعيلها).
5. اضغط **"Deploy"**.

سيقوم Vercel ببناء تطبيق Next.js وتحويل أي طلب لرفع الصور أو استعراضها تلقائياً إلى خادم Railway مع التخزين الدائم!

---

## 3. فحص الموقع محلياً (Local Development)

### تشغيل الفرونت إند:
```bash
npm run dev
# يعمل على http://localhost:3000
```

### تشغيل الباكيند محلياً:
```bash
cd backend
npm install
npm start
# يعمل على http://localhost:3001
```
