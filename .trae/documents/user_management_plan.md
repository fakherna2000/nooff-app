# إدارة المستخدمين — خطة التنفيذ

## أبحاث المستودع

### الوضع الحالي
- المستخدمون مخزّنون في `auth.users` في Supabase Auth فقط. لا يوجد جدول `profiles`.
- الدور يُخزّن في `app_metadata.role` أو `user_metadata.role` (قيمتان: `admin` أو `patient`).
- المرضى مرتبطون بجدول `patients` عبر `user_id` (يُنشأ حساب المريض عند إضافة مريض جديد في [patients/route.ts](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/src/app/api/admin/patients/route.ts)).
- يتم إنشاء المستخدمين عبر `supabase.auth.admin.createUser` وحذفهم عبر `supabase.auth.admin.deleteUser`.
- دور الأدمن يُستخرج في [useAuth.tsx](file:///c:/Users/mmis1/Documents/trae_projects/noof-app/src/hooks/useAuth.tsx#L72-L78) من `app_metadata.role`.

### القيود
- للوصول لقائمة جميع المستخدمين وتعديل الأدوار نحتاج Service Role Key (`createAdminClient`).
- تغيير الدور يتطلب تحديث `app_metadata` عبر `supabase.auth.admin.updateUserById`.
- حذف المستخدم يحذف حساب Auth فقط؛ يجب تنظيف بيانات المريض المرتبطة (أو إبقائها حسب الحاجة).

## الملفات والوحدات

| الملف | التغيير المتوقع |
|---|---|
| `src/app/api/admin/users/route.ts` | **جديد** — `GET` لجلب كل المستخدمين، `POST` لإنشاء مستخدم جديد |
| `src/app/api/admin/users/[id]/route.ts` | **جديد** — `PUT` لتحديث بيانات/دور المستخدم، `DELETE` لحذف المستخدم |
| `src/app/api/admin/users/[id]/reset-password/route.ts` | **جديد** — `POST` لإعادة تعيين كلمة مرور المستخدم |
| `src/app/admin/users/page.tsx` | **جديد** — صفحة إدارة المستخدمين (جدول + نموذج إضافة/تعديل) |
| `src/app/admin/layout.tsx` | تعديل — إضافة رابط "المستخدمون" في القائمة الجانبية |
| `src/hooks/useAuth.tsx` | تعديل بسيط (اختياري) — تأكيد أن الدور يُقرأ من `app_metadata` |

## خطوات التنفيذ

1. **إنشاء API لجلب المستخدمين** (`GET /api/admin/users`)
   - يستخدم `createAdminClient().auth.admin.listUsers()` مع pagination.
   - يربط بيانات `patients` لاستخراج الاسم والهاتف إن وجد.
   - يتحقق من صلاحيات الأدمن.

2. **إنشاء API لإنشاء مستخدم** (`POST /api/admin/users`)
   - `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, role } })`.
   - تعيين `app_metadata.role` عبر `updateUserById` بعد الإنشاء (لأن createUser لا يدعم app_metadata مباشرة في بعض الإصدارات).
   - إنشاء سجل مريض مرتبط إن كان الدور `patient`.

3. **إنشاء API لتحديث مستخدم** (`PUT /api/admin/users/[id]`)
   - تحديث `email`, `user_metadata.full_name`.
   - تغيير الدور عبر `updateUserById({ app_metadata: { role: newRole } })`.
   - إنشاء/حذف ربط المريض حسب تغيير الدور.

4. **إنشاء API لحذف مستخدم** (`DELETE /api/admin/users/[id]`)
   - `supabase.auth.admin.deleteUser(id)`.
   - حذف سجل المريض المرتبط إن وجد.

5. **إنشاء API لإعادة تعيين كلمة المرور** (`POST /api/admin/users/[id]/reset-password`)
   - `updateUserById({ password: newPassword })`.

6. **بناء صفحة المستخدمين** (`/admin/users`)
   - جدول يعرض: الاسم، البريد، الدور (badge)، حالة التفعيل، تاريخ الإنشاء، إجراءات.
   - زر "إضافة مستخدم" يفتح Modal (الاسم، البريد، كلمة المرور، الدور).
   - لكل صف: تعديل، إعادة تعيين كلمة المرور، حذف (مع تأكيد).
   - بحث حسب الاسم/البريد.

7. **إضافة رابط القائمة** في `layout.tsx`.

## الاعتمادات والملاحظات

- Service Role Key متاح في `createAdminClient()`.
- `updateUserById` يدعم `app_metadata` و `user_metadata` و `password`.
- عند تغيير دور مستخدم من `patient` إلى `admin`، لن يُحذف سجل المريض (يبقى للأرشيف) لكن يُفصل الربط.
- عند تغيير الدور من `admin` إلى `patient`، يُنشأ سجل مريض جديد مرتبط إن لم يكن موجوداً.

## التحقق

- `npx tsc --noEmit` يمر بدون أخطاء.
- `npm run build` ينجح.
- يدويًا: تسجيل دخول كـ admin → فتح `/admin/users` → إضافة مستخدم → تعديل دوره → إعادة تعيين كلمة المرور → حذف.
- التأكد من أن المستخدم الجديد يستطيع تسجيل الدخول بالدور الصحيح.

## المخاطر

- **مخاطر**: `app_metadata` لا يُحدّث فوراً في جلسة المستخدم الحالية. **التعامل**: المستخدم يجب أن يعيد تسجيل الدخول لتطبيق تغيير الدور.
- **مخاطر**: حذف مستخدم قد يكسر بيانات المواعيد المرتبطة. **التعامل**: حذف المستخدم فقط لا يحذف المواعيد (تبقى كـ سجل أرشيف ببيانات المريض).
- **مخاطر**: إضافة أدمن جديد بدون كلمة مرور قوية. **التعامل**: نموذج الإضافة يطلب كلمة مرور ولا يسمح بكلمات ضعيفة.
