# ديم هيلث (Deem Health) — متجر المكملات الغذائية والفيتامينات

متجر إلكتروني عراقي متكامل لبيع الفيتامينات والمكملات الغذائية، مبني بأحدث تقنيات الويب:
- **الواجهة الأمامية (Frontend)**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Lucide Icons (مجهزة للرفع على **Vercel**).
- **الواجهة الخلفية والتخزين (Backend & Storage)**: خادم Express و Docker مع قرص تخزين دائم (Volume Mount) مجهز للرفع على **Railway**.
- **الدفع والشحن**: دفع عند الاستلام فقط (Cash on Delivery) داخل العراق مع حساب أجور الشحن لكافة المحافظات الـ 18.

---

## الهيكل والمكونات

```
deem-health/
├── src/
│   └── app/
│       ├── api/orders/route.ts      # معالجة وتمرير الطلبات
│       ├── globals.css              # رموز هوية ديم هيلث (Plum, Lavender, Sun)
│       ├── layout.tsx               # الخط العربي (Readex Pro) والتوافق مع RTL
│       └── page.tsx                 # صفحة المتجر، السلة، وإتمام الطلب (COD)
├── backend/
│   ├── Dockerfile                   # حاوية Docker مجهزة لـ Railway
│   ├── package.json
│   └── server.js                    # خادم Express للتخزين والـ Volume
├── public/
│   ├── brand/                       # شعار وهوية ديم هيلث
│   └── images/                      # صور نمط الحياة والمنتجات
├── DEPLOYMENT.md                    # دليل النشر بالتفصيل على Vercel و Railway
├── railway.json                     # إعدادات نشر Railway
├── vercel.json                      # إعدادات نشر Vercel
└── next.config.ts                   # إعدادات التحويل لخدمة التخزين
```

---

## التشغيل محلياً

```bash
# تثبيت الحزم
npm install

# تشغيل واجهة المتجر
npm run dev
```

للمزيد من تفاصيل الرفع على السيرفرات السحابية، راجع ملف [DEPLOYMENT.md](file:///c:/Users/muame/deem%20health/DEPLOYMENT.md).
