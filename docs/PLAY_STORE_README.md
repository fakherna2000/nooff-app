# جاهزية مركز نوف لـ Google Play Store & App Store — قائمة فحص كاملة

> آخر تحديث: 2026-10-07 | الإصدار 1.0.0

---

## ✅ الجزء 1: متطلبات جوجل بلاي (Android) — المكتمل الآن

| العنصر | الحالة | المكان / التعليقات |
|---|---|---|
| 🎯 `applicationId` فريد: `com.noof.dental.clinic` | ✅ | [app/build.gradle](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/build.gradle#L7) |
| 🎯 Target SDK 34 (Android 14) | ✅ | [build.gradle](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/build.gradle) (من rootProject.ext) |
| 🎯 Min SDK 22 (أندرويد 5.1+) | ✅ | — |
| 🎯 Version Code: 1 · Version Name: 1.0.0 | ✅ | [build.gradle](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/build.gradle#L10-L11) |
| 🎯 توقيع الإصدار الرسمي (Release Signing) | ✅ ⚠ يحتاج تشغيل [generate-keystore.ps1](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/scripts/generate-keystore.ps1) |
| 🎯 Android App Bundle `.aab` (مطلوب للستور الآن) | ✅ سكربت جاهز: `npm run android:release:aab` | ينتج الملف في: `android/app/build/outputs/bundle/release/app-release.aab` |
| 🎯 AndroidManifest: صلاحيات صحيحة + RTL + شاشة عمودية فقط | ✅ | [AndroidManifest.xml](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/src/main/AndroidManifest.xml) |
| 🎯 أيقونات Adaptive Icons (foreground + background + round) | ✅ مولدة من icon-512.png عبر npm run android:icons | مجلد `android/app/src/main/res/mipmap-*` |
| 🎯 Splash Screen للأحجام جميعها | ✅ | مجلدات `drawable-port-*` و `drawable-land-*` |
| 🎯 تمكين R8 + Shrink Resources (ضغط وتشفير الكود) | ✅ | [build.gradle: release](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/build.gradle#L46-L59) |
| 🎯 debugSymbolLevel FULL (متطلبات جوجل للـ NDK) | ✅ | نفس المكان ↑ |
| 🎯 Network Security Config للـ HTTPS فقط في الإنتاج | ✅ | [network_security_config.xml](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/app/src/main/res/xml/network_security_config.xml) |
| 🎯 App Links / Deep Links مع queries | ✅ | queries في AndroidManifest لتشغيل روابط https خارجية |

---

## 🎁 الجزء 2: Store Listing (البيانات للرفع) — ما تحتاجه أنت

جوجل بلاي يطلب الملفات التالية عند إنشاء التطبيق في Google Play Console:

### 🏷️ النصوص (Copy-Paste جاهز لك):

```
اسم التطبيق (إنجليزي - 30 حرف max): Noof Dental Clinic
اسم التطبيق (عربي): مركز نوف لطب الأسنان

وصف قصير (عربي - 80 حرف):
بوابة المريض الذكية لمركز نوف لطب الأسنان - مواعيد، خطط علاج، فواتير.

وصف كامل (عربي - 4000 حرف max):
مرحباً بك في تطبيق مركز نوف لطب الأسنان 🦷

التطبيق الرسمي لبوابة المريض في مركز نوف، يتيح لك:

📅 المواعيد:
• عرض جميع المواعيد القادمة والسابقة
• تفاصيل الطبيب والتخصص ومدة الزيارة
• تذكير فوري قبل موعدك بإشعار push

💊 خطة العلاج:
• عرض خطة العلاج كاملة مقسمة لمراحل
• معرفة ما تم إنجازه وما تبقى
• تقدم بصري % لكل مرحلة

💰 الحسابات المالية:
• إجمالي تكلفة خطة العلاج
• المدفوع حتى الآن + المتبقي
• تفاصيل كل دفعة (التاريخ + الطريقة + المبلغ)

👤 ملفك الشخصي:
• بياناتك الأساسية (الاسم، الهاتف، تاريخ الميلاد)
• تحديث الأرقام بسهولة

🔕 إشعارات فورية:
• تذكير بمواعيدك قبل يوم وساعة
• عند تحديث حالة خطتك العلاجية
• عند تأكيد موعد جديد أو تعديل موعد قائم

🌐 يعمل بدون إنترنت:
بعد أول تسجيل دخول، كل بياناتك متاحة حتى بدون اتصال بالإنترنت.

مركز نوف — ابتسامة أنصفكم دائماً 💙
```

### 🖼️ الأصول البصرية (Images - المقاسات المطلوبة):

| الملف | المقاس (بكسل) | الحجم الآمن (MB) | ملاحظات |
|---|---|---|---|
| **Icon 512x512** (للستور فقط) | 512 × 512 · PNG 32-bit | < 1 MB | استخدم [icon-512.png](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/public/icon-512.png) مباشرة ✅ |
| **Feature Graphic** (Banner الأعلى في صفحة التطبيق) | 1024 × 500 · JPG أو PNG 24-bit | < 1 MB | خلفيته أنيقة: تدرج أزرق + بنفسجي مع شعار المركز (نفترض إعداده لاحقاً) |
| **Screenshots - الهاتف** (Portrait) | من 1080×1920 إلى 1440×2560 · JPG/PNG | لكل صورة < 8 MB | 3 إلى 8 صور من الشاشات الرئيسية (مواعيد · خطة علاج · دفعات · الملف الشخصي) |
| **Screenshots - Tablet 7"** (اختياري لكن يفضل) | 1200×1920 · JPG/PNG | — | نفس الشاشات بلوحة أكبر |
| **Screenshots - Tablet 10"** (اختياري) | 1440×2560 · JPG/PNG | — | — |

### 🧑‍⚕️ بيانات التطبيق الإضافية في Play Console:

| الحقل | القيمة المقترحة |
|---|---|
| التطبيق مدفوع أم مجاني؟ | **مجاني** |
| الفئة (Category) | **Medical** أو **Health & Fitness** |
| الوسوم (Tags) | `Dental, Clinic, Medical, Health, Appointments, Patient` |
| البريد الإلكتروني للتواصل | `admin@noof-center.com` (أو بريدك الفعلي) |
| الموقع الإلكتروني | `https://your-domain.vercel.app` |
| الهاتف | `+963 --- --- ---` |
| سياسة الخصوصية (Privacy Policy URL) | رابط صفحة html بسيطة تشرح عدم جمع بيانات حساسة |
| الرسالة الإرشادية (Content Rating) | أجب على استبيان IARC → عادةً يحصل على **PEGI 3 / Everyone** |
| الاستهداف (Target audience) | **0 سنة فما فوق** أو حسب سياسة المركز (عادة 13+) |

---

## 🔐 الجزء 3: الأمان قبل الرفع — قائمة فحص

- [ ] **تشغيل سكربت توليد المفتاح**: `npm run android:keystore`
  - ينتج: `android/app/noof-release-key.jks` + `android/keystore.properties`
- [ ] **أخذ نسخة احتياطية من المفتاح**: احفظ `noof-release-key.jks` في:
  1. قرص USB مشفر (غير متصل بالإنترنت عند الحفظ)
  2. Google Drive / OneDrive محمي بكلمة مرور منفصلة
  3. مدير كلمات سر موثوق (1Password / Bitwarden)
- [ ] **لا ترفع ملفات المفتاح على GitHub**: مضافة مسبقاً في [android/.gitignore](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/android/.gitignore) ✅
- [ ] **تغيير كلمات المرور الافتراضية**: افتح `android/keystore.properties` وغيّر القيم الأصلية `NoofDentalClinic2026!` لكلمات سر قوية مختلفة (حروف كبيرة وصغيرة + أرقام + رموز، 16 حرف على الأقل).

---

## 🚀 الجزء 4: خطوات البناء النهائي (قبل الرفع)

نفذ هذه الأوامر بالترتيب في **Terminal** داخل مجلد المشروع:

```bash
# 1. توليد مفتاح التوقيع الرسمي (مرة واحدة فقط):
npm run android:keystore

# 2. نسخ قيمه keystore.properties.example وتعديل كلمات السر:
#    → افتح android/keystore.properties (المولود في الخطوة 1)
#    → غيّر STORE_PASSWORD و KEY_PASSWORD لكلمات سر قوية خاصة بك

# 3. عدّل capacitor.config.ts:
#    → غيّر PROD_SERVER_URL إلى دومينك الفعلي (مثال: https://noof.vercel.app/patient)
#    → أو أزل سطر url كلياً لو بتريد تضيف ملفات Next.js مباشرة داخل التطبيق

# 4. إجراء تنظيف كامل للمشروع:
npm run android:clean

# 5. بناء نسخة الإنتاج الرسمية App Bundle (AAB) - المطلوب للستور:
npm run android:release:aab

# 6. بعد الانتهاء، سيظهر لك المسار:
#    android/app/build/outputs/bundle/release/app-release.aab 🔥
```

---

## 📲 الجزء 5: رفع أول إصدار على Google Play

1. ادخل على [Google Play Console](https://play.google.com/console/) وسجل الدخول بحساب المطور (25$ تسجيل لمرة واحدة).
2. اضغط **Create app** → اختر App → أدخل الاسم + Default language (Arabic) + Free → App type = App.
3. املأ صفحة **Store presence → Main store listing**: الصور + الوصف + الأيقونة + الفئة.
4. انتقل إلى **Release → Testing → Internal testing**:
   - أنشئ Release جديد → رفع ملف `app-release.aab` → املأ ملاحظات الإصدار.
   - أضف أيميلات المخبرين (لنفسك وللفريق) → راجع الطلب → Start rollout.
5. بعد التأكد من كل شي على Internal testing → ارقيه إلى **Closed testing** → ثم **Open testing** → أخيراً **Production**.
6. جوجل تأخذ عادةً 2 إلى 7 أيام لمراجعة التطبيق الأول.

---

## 🍎 الجزء 6: متطلبات Apple App Store (عندما تريد الرفع لآيفون)

| العنصر | المتطلب |
|---|---|
| جهاز Mac مع macOS 14+ و Xcode 15+ | إلزامي لبناء وتوقيع تطبيقات iOS |
| Apple Developer Membership | 99$ سنوياً |
| Bundle ID | `com.noof.dental.clinic` (نفس Android) |
| App Store Connect account | مطلوب |
| لغة عرض افتراضية + عربية | English (UK) + Arabic |
| iPhone Screenshots | 6.5" (1242×2688) و 6.7" (1290×2796) |
| iPad Screenshots | 12.9" (2048×2732) × جيلين |
| App Privacy Details (Nutrition Label) | بيانات التي تُجمع من المريض (اسم + هاتف فقط) |

السكربت القريب لإضافة المنصة آيفون لاحقاً:
```bash
npm i -D @capacitor/ios && npx cap add ios
```

---

## 🎉 ملخص السكربتات الجديدة في package.json:

| الأمر | الوظيفة |
|---|---|
| `npm run android:keystore` | 🔐 توليد مفتاح توقيع الرسمي + ملف الخصائص (مرة واحدة) |
| `npm run android:dev` | 🔨 بناء نسخة Debug محلية للهاتف + وصول لـ 192.168.1.209 |
| `npm run android:release:apk` | 📱 بناء APK مرقم الرسمي (للتوزيع الخارجي غير المتجر) |
| `npm run android:release:aab` | 📦 بناء App Bundle الرسمي (المطلوب للرفع على جوجل بلاي 🔥) |
| `npm run android:clean` | 🧹 تنظيف build cache قبل إعادة بناء إصدار جديد |
| `npm run android:open` | 💻 فتح المشروع مباشرة في Android Studio |
