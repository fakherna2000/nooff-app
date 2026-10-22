// =====================================================================
// سجل نصوص واجهة تطبيق المريض
// Patient app UI texts registry — مفاتيح النصوص والقيم الافتراضية
// المفاتيح هنا يجب أن تطابق قيم data-noof-text داخل public/patient/index.html
// =====================================================================

export interface UiTextField {
  key: string;
  label: string;
  default: string;
}

export interface UiTextGroup {
  id: string;
  label: string;
  description?: string;
  fields: UiTextField[];
}

export const UI_TEXT_GROUPS: UiTextGroup[] = [
  {
    id: 'login',
    label: 'شاشة تسجيل الدخول',
    description: 'نصوص بوابة الدخول للمريض',
    fields: [
      { key: 'login.subtitle', label: 'العنوان الفرعي', default: 'البوابة الإلكترونية للمرضى' },
      { key: 'login.email_label', label: 'تسمية حقل البريد', default: 'البريد الإلكتروني' },
      { key: 'login.email_placeholder', label: 'نص داخل حقل البريد', default: 'patient@email.com' },
      { key: 'login.password_label', label: 'تسمية حقل كلمة المرور', default: 'كلمة المرور' },
      { key: 'login.password_placeholder', label: 'نص داخل حقل كلمة المرور', default: '••••••••' },
      { key: 'login.button', label: 'زر الدخول', default: 'تسجيل الدخول' },
      { key: 'login.loading', label: 'نص أثناء الدخول', default: 'جاري الدخول...' },
      { key: 'login.hint', label: 'ملاحظة أسفل النموذج', default: 'للدخول، استخدم البريد الإلكتروني وكلمة المرور التي زودك بها المركز' },
      { key: 'login.error_empty', label: 'رسالة حقول فارغة', default: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' },
    ],
  },
  {
    id: 'header',
    label: 'ترويسة التطبيق',
    description: 'النصوص العلوية داخل التطبيق بعد الدخول',
    fields: [
      { key: 'header.welcome', label: 'الترحيب', default: 'مرحباً بك' },
      { key: 'header.clinic_prefix', label: 'بادئة اسم العيادة', default: 'في عيادتنا' },
      { key: 'header.tagline', label: 'الشعار التسويقي', default: 'نحن هنا لنعتني بابتسامتك وجمالك' },
      { key: 'header.note', label: 'الملاحظة التعريفية', default: 'واجهة أنعم وأوضح لتصفح الخدمات، الحجز، والعروض من مكان واحد.' },
      { key: 'header.book_now', label: 'زر احجز الآن', default: 'احجز الآن' },
      { key: 'header.logout', label: 'زر الخروج', default: 'خروج' },
      { key: 'header.logout_title', label: 'تلميح زر الخروج', default: 'تسجيل الخروج' },
      { key: 'header.brand_sub', label: 'السطر أسفل الشعار', default: 'Dental & Aesthetic' },
    ],
  },
  {
    id: 'home.services',
    label: 'الرئيسية — الخدمات والاختصارات',
    fields: [
      { key: 'home.services.title', label: 'عنوان قسم الخدمات', default: 'خدماتنا' },
      { key: 'home.services.subtitle', label: 'وصف قسم الخدمات', default: 'اختاري الخدمة المناسبة لك' },
      { key: 'home.quick.dental_title', label: 'كرت طب الأسنان — العنوان', default: 'طب الأسنان' },
      { key: 'home.quick.dental_desc', label: 'كرت طب الأسنان — الوصف', default: 'ابتسامة صحية وجميلة' },
      { key: 'home.quick.beauty_title', label: 'كرت التجميل — العنوان', default: 'التجميل' },
      { key: 'home.quick.beauty_desc', label: 'كرت التجميل — الوصف', default: 'بشرة ناعمة وجمال طبيعي' },
      { key: 'home.shortcut.book', label: 'اختصار حجز موعد', default: 'حجز موعد' },
      { key: 'home.shortcut.offers', label: 'اختصار العروض', default: 'العروض' },
      { key: 'home.shortcut.loyalty', label: 'اختصار العروض المميزة', default: 'العروض المميزة' },
      { key: 'home.shortcut.contact', label: 'اختصار تواصل معنا', default: 'تواصل معنا' },
    ],
  },
  {
    id: 'home.notif',
    label: 'الرئيسية — بطاقة الإشعارات',
    fields: [
      { key: 'home.notif.title', label: 'عنوان البطاقة', default: 'إشعارات المواعيد' },
      { key: 'home.notif.button', label: 'زر التفعيل', default: 'تفعيل الإشعارات' },
    ],
  },
  {
    id: 'home.featured',
    label: 'الرئيسية — الخدمات المميزة',
    fields: [
      { key: 'home.featured.title', label: 'عنوان القسم', default: 'خدماتنا المميزة' },
      { key: 'home.featured.subtitle', label: 'وصف القسم', default: 'الأكثر طلباً داخل المركز' },
      { key: 'home.featured.item1_title', label: 'البطاقة الأولى — العنوان', default: 'تبييض الأسنان' },
      { key: 'home.featured.item1_desc', label: 'البطاقة الأولى — الوصف', default: 'ابتسامة أنصع ولمعان طبيعي.' },
      { key: 'home.featured.item2_title', label: 'البطاقة الثانية — العنوان', default: 'عناية بالبشرة' },
      { key: 'home.featured.item2_desc', label: 'البطاقة الثانية — الوصف', default: 'حلول تجميلية ناعمة ومشرقة.' },
      { key: 'home.featured.item3_title', label: 'البطاقة الثالثة — العنوان', default: 'فيلر وبوتكس' },
      { key: 'home.featured.item3_desc', label: 'البطاقة الثالثة — الوصف', default: 'مظهر متوازن بلمسات خفيفة.' },
    ],
  },
  {
    id: 'home.doctors',
    label: 'الرئيسية — قسم الأطباء',
    fields: [
      { key: 'home.doctors.title', label: 'عنوان القسم', default: 'تعرّفي على أطبائنا' },
      { key: 'home.doctors.subtitle', label: 'وصف القسم', default: 'خبرات موثوقة ولمسة إنسانية في العلاج' },
    ],
  },
  {
    id: 'home.appt',
    label: 'الرئيسية — الموعد القادم',
    fields: [
      { key: 'home.appt.title', label: 'عنوان البطاقة', default: 'موعدك القادم' },
      { key: 'home.appt.chip', label: 'الشارة', default: 'قادم' },
      { key: 'home.appt.reschedule', label: 'زر إعادة الجدولة', default: 'إعادة جدولة' },
      { key: 'home.appt.confirm', label: 'زر تأكيد الحضور', default: 'تأكيد الحضور' },
      { key: 'home.appt.empty_title', label: 'عنوان لا يوجد موعد', default: 'لا يوجد مواعيد قادمة' },
      { key: 'home.appt.empty_desc', label: 'وصف لا يوجد موعد', default: 'يمكنك طلب موعد جديد من زر "طلب موعد جديد"' },
    ],
  },
  {
    id: 'home.metric',
    label: 'الرئيسية — المؤشرات',
    fields: [
      { key: 'home.metric.upcoming', label: 'مواعيد قادمة (تقويم)', default: 'مواعيد قادمة' },
      { key: 'home.metric.current_aligner', label: 'القالب الحالي', default: 'القالب الحالي' },
      { key: 'home.metric.progress', label: 'تقدّم الخطة', default: 'تقدّم الخطة' },
      { key: 'home.metric.upcoming_general', label: 'مواعيد قادمة (عام)', default: 'مواعيد قادمة' },
      { key: 'home.metric.visits_done', label: 'زيارات مكتملة', default: 'زيارات مكتملة' },
    ],
  },
  {
    id: 'home.journey',
    label: 'الرئيسية — رحلة العلاج',
    fields: [
      { key: 'home.journey.title', label: 'عنوان القسم', default: 'رحلة العلاج' },
      { key: 'home.journey.subtitle', label: 'وصف القسم', default: 'مراحل الخطة الحالية' },
      { key: 'home.nextstep.title', label: 'عنوان خطوتك القادمة', default: 'خطوتك القادمة' },
      { key: 'home.nextstep.subtitle', label: 'وصف خطوتك القادمة', default: 'المتابعة الموصى بها' },
      { key: 'home.nextstep.desc', label: 'تفاصيل الخطوة القادمة', default: 'مدة إرتداء القالب الحالي 7 أيام من تاريخ بدايته' },
    ],
  },
  {
    id: 'home.diagnosis',
    label: 'الرئيسية — تشخيص الطبيب',
    fields: [
      { key: 'home.diagnosis.title', label: 'عنوان القسم', default: 'تشخيص الطبيب' },
      { key: 'home.diagnosis.subtitle', label: 'وصف القسم', default: 'ملخص الحالة الحالية' },
      { key: 'home.diagnosis.note', label: 'ملاحظة أسفل التشخيص', default: 'للتواصل مع الطبيب حول التشخيص، يرجى حجز موعد أو الاتصال بالعيادة.' },
    ],
  },
  {
    id: 'appointments',
    label: 'صفحة المواعيد',
    fields: [
      { key: 'appointments.title', label: 'عنوان الصفحة', default: 'مواعيدي' },
      { key: 'appointments.subtitle', label: 'وصف الصفحة', default: 'تابعي مواعيدك القادمة والسابقة' },
      { key: 'appointments.filter.upcoming', label: 'فلتر القادمة', default: 'القادمة' },
      { key: 'appointments.filter.past', label: 'فلتر السابقة', default: 'السابقة' },
      { key: 'appointments.add', label: 'زر حجز موعد جديد', default: '+ حجز موعد جديد' },
      { key: 'appointments.reschedule', label: 'زر إعادة الجدولة', default: 'إعادة جدولة' },
      { key: 'appointments.empty', label: 'رسالة لا توجد مواعيد', default: 'لا توجد مواعيد ضمن هذا التصنيف حالياً' },
    ],
  },
  {
    id: 'posts',
    label: 'صفحة العروض',
    fields: [
      { key: 'posts.title', label: 'عنوان الصفحة', default: 'العروض والخدمات المميزة' },
      { key: 'posts.banner.kicker', label: 'نص البانر العلوي', default: 'عرض خاص' },
      { key: 'posts.banner.title', label: 'عنوان البانر', default: 'عرض خاص على تبييض الأسنان' },
      { key: 'posts.banner.desc', label: 'وصف البانر', default: 'ابتسامة أكثر إشراقاً بإطلالة أهدأ وأناقة أجمل' },
      { key: 'posts.banner.button', label: 'زر البانر', default: 'احجز الآن' },
      { key: 'posts.empty', label: 'رسالة لا توجد عروض (بانر)', default: 'لا توجد عروض بعد' },
      { key: 'posts.empty_list', label: 'رسالة لا توجد عروض (قائمة)', default: 'لا توجد عروض' },
    ],
  },
  {
    id: 'treatment',
    label: 'صفحة الخدمات',
    fields: [
      { key: 'treatment.title', label: 'عنوان الصفحة', default: 'خدمات الاسنان' },
      { key: 'treatment.subtitle', label: 'وصف الصفحة', default: 'لإبتسامة أكثر صحة وجمالاً' },
      { key: 'treatment.plan.title', label: 'خطة التقويم — العنوان', default: 'خطة التقويم الشفاف' },
      { key: 'treatment.plan.subtitle', label: 'خطة التقويم — الوصف', default: 'التقدّم الحالي' },
      { key: 'treatment.stages.title', label: 'المراحل والقوالب — العنوان', default: 'المراحل والقوالب' },
      { key: 'treatment.stages.subtitle', label: 'المراحل والقوالب — الوصف', default: 'سجل الخطة' },
      { key: 'treatment.diagnosis.title', label: 'التشخيص — العنوان', default: 'تشخيص الطبيب' },
      { key: 'treatment.diagnosis.subtitle', label: 'التشخيص — الوصف', default: 'تفاصيل الحالة الحالية' },
      { key: 'treatment.diagnosis.note', label: 'التشخيص — الملاحظة', default: 'للتواصل مع الطبيب حول التشخيص، يرجى حجز موعد أو الاتصال بالعيادة.' },
    ],
  },
  {
    id: 'profile',
    label: 'صفحة الملف الشخصي',
    fields: [
      { key: 'profile.title', label: 'عنوان الصفحة', default: 'ملفي الشخصي' },
      { key: 'profile.notif.title', label: 'بطاقة الإشعارات — العنوان', default: 'إشعارات المواعيد' },
      { key: 'profile.notif.button', label: 'بطاقة الإشعارات — الزر', default: 'تفعيل الإشعارات' },
      { key: 'profile.info.fullname', label: 'تسمية الاسم الكامل', default: 'الاسم الكامل:' },
      { key: 'profile.info.dob', label: 'تسمية تاريخ الميلاد', default: 'تاريخ الميلاد:' },
      { key: 'profile.info.gender', label: 'تسمية الجنس', default: 'الجنس:' },
      { key: 'profile.info.phone', label: 'تسمية رقم الهاتف', default: 'رقم الهاتف:' },
      { key: 'profile.info.email', label: 'تسمية البريد الإلكتروني', default: 'البريد الإلكتروني:' },
      { key: 'profile.info.address', label: 'تسمية العنوان', default: 'العنوان:' },
      { key: 'profile.info.medical', label: 'تسمية الحالات الصحية', default: 'الحالات الصحية والأدوية:' },
      { key: 'profile.info.allergies', label: 'تسمية الحساسيات', default: 'حساسيات معروفة:' },
      { key: 'profile.menu.details', label: 'القائمة — معلوماتي الشخصية', default: 'معلوماتي الشخصية' },
      { key: 'profile.menu.history', label: 'القائمة — سجل المواعيد', default: 'سجل المواعيد' },
      { key: 'profile.menu.offers', label: 'القائمة — العروض والخصومات', default: 'العروض والخصومات' },
      { key: 'profile.menu.contact', label: 'القائمة — التواصل معنا', default: 'التواصل معنا' },
      { key: 'profile.menu.settings', label: 'القائمة — الإعدادات', default: 'الإعدادات' },
      { key: 'profile.menu.loyalty', label: 'القائمة — محفظة النقاط', default: 'محفظة النقاط والمكافآت' },
      { key: 'profile.footer.call', label: 'زر اتصل بالعيادة', default: '📞 اتصل بالعيادة' },
      { key: 'profile.footer.logout', label: 'زر تسجيل الخروج', default: '🚪 تسجيل الخروج' },
    ],
  },
  {
    id: 'loyalty',
    label: 'محفظة النقاط والمكافآت',
    fields: [
      { key: 'loyalty.title', label: 'عنوان الصفحة', default: 'محفظة النقاط' },
      { key: 'loyalty.subtitle', label: 'وصف الصفحة', default: 'اكسبي نقاط واحصلي على مكافآت' },
      { key: 'loyalty.back', label: 'زر الرجوع', default: 'رجوع' },
      { key: 'loyalty.balance_label', label: 'تسمية الرصيد', default: 'رصيدك الحالي' },
      { key: 'loyalty.unit', label: 'وحدة النقاط', default: 'نقطة' },
      { key: 'loyalty.foot_rate', label: 'ملاحظة معدل الكسب', default: 'نقطتان لكل موعد مؤكد' },
      { key: 'loyalty.rewards.title', label: 'المكافآت — العنوان', default: 'المكافآت المتاحة' },
      { key: 'loyalty.rewards.subtitle', label: 'المكافآت — الوصف', default: 'استبدلي نقاطك' },
      { key: 'loyalty.rewards_empty', label: 'رسالة لا توجد مكافآت', default: 'لا توجد مكافآت متاحة حالياً' },
      { key: 'loyalty.history.title', label: 'سجل النقاط — العنوان', default: 'سجل النقاط' },
      { key: 'loyalty.history.subtitle', label: 'سجل النقاط — الوصف', default: 'آخر الحركات' },
      { key: 'loyalty.loading', label: 'رسالة التحميل', default: 'جاري تحميل المكافآت...' },
      { key: 'loyalty.empty', label: 'رسالة لا توجد حركات', default: 'لا توجد حركات بعد' },
      { key: 'loyalty.redeem', label: 'زر الاستبدال', default: 'استبدال' },
      { key: 'loyalty.insufficient', label: 'نص نقاط غير كافية', default: 'نقاط غير كافية' },
    ],
  },
  {
    id: 'nav',
    label: 'شريط التنقل السفلي',
    fields: [
      { key: 'nav.home', label: 'الرئيسية', default: 'الرئيسية' },
      { key: 'nav.appointments', label: 'حجوزاتي', default: 'حجوزاتي' },
      { key: 'nav.posts', label: 'العروض', default: 'العروض' },
      { key: 'nav.profile', label: 'ملفي', default: 'ملفي' },
    ],
  },
  {
    id: 'booking',
    label: 'نافذة حجز الموعد',
    fields: [
      { key: 'booking.title', label: 'عنوان النافذة', default: 'طلب موعد جديد' },
      { key: 'booking.reschedule_title', label: 'عنوان إعادة الجدولة', default: 'إعادة جدولة الموعد' },
      { key: 'booking.step1', label: 'الخطوة 1', default: 'الخدمة' },
      { key: 'booking.step2', label: 'الخطوة 2', default: 'الطبيب' },
      { key: 'booking.step3', label: 'الخطوة 3', default: 'التاريخ' },
      { key: 'booking.step4', label: 'الخطوة 4', default: 'الوقت' },
      { key: 'booking.service_type_label', label: 'تسمية نوع الخدمة', default: 'اختر نوع الخدمة' },
      { key: 'booking.category.dental', label: 'تصنيف طب الأسنان', default: 'طب الأسنان' },
      { key: 'booking.category.beauty', label: 'تصنيف التجميل', default: 'التجميل' },
      { key: 'booking.service_label', label: 'تسمية اختيار الخدمة', default: 'اختر الخدمة' },
      { key: 'booking.day_label', label: 'تسمية اختيار اليوم', default: 'اختر اليوم' },
      { key: 'booking.time_label', label: 'تسمية اختيار الوقت', default: 'اختر الوقت' },
      { key: 'booking.notes_label', label: 'تسمية الملاحظات', default: 'ملاحظات إضافية' },
      { key: 'booking.notes_placeholder', label: 'نص داخل الملاحظات', default: 'اذكري أي ملاحظة مهمة للطبيب أو للفريق...' },
      { key: 'booking.cancel', label: 'زر إلغاء', default: 'إلغاء' },
      { key: 'booking.prev', label: 'زر رجوع', default: 'رجوع' },
      { key: 'booking.next', label: 'زر التالي', default: 'التالي' },
      { key: 'booking.continue', label: 'زر متابعة', default: 'متابعة' },
      { key: 'booking.sending', label: 'نص أثناء الإرسال', default: 'جاري الإرسال...' },
      { key: 'booking.submit', label: 'زر الإرسال', default: 'إرسال الطلب' },
    ],
  },
];

export const UI_TEXT_DEFAULTS: Record<string, string> = UI_TEXT_GROUPS.reduce(
  (acc, group) => {
    group.fields.forEach((field) => {
      acc[field.key] = field.default;
    });
    return acc;
  },
  {} as Record<string, string>
);
