import Link from 'next/link';
import { ShieldCheck, User, Calendar, CreditCard, Sparkles, Wifi, Bell } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <User className="w-6 h-6" />,
      title: 'إدارة المرضى',
      desc: 'أرشفة شامل لبيانات المرضى مع إمكانية البحث السريع',
      color: 'bg-primary-100 text-primary-600',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'المواعيد',
      desc: 'جدولة وتنظيم المواعيد مع تذكيرات تلقائية',
      color: 'bg-accent-100 text-accent-600',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'خطط العلاج',
      desc: 'تقسيم العلاج إلى مراحل مع متابعة التقدم',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'إدارة الدفعات',
      desc: 'تتبع المدفوعات والمبالغ المتبقية تلقائيًا',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: <Wifi className="w-6 h-6" />,
      title: 'عمل بدون إنترنت',
      desc: 'الوصول للبيانات حتى بدون اتصال بالإنترنت',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'إشعارات فورية',
      desc: 'تذكيرات المواعيد وتحديثات الحالة مباشرة على الهاتف',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">ن</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">مركز نوف</h1>
              <p className="text-xs text-gray-500">لطب الأسنان</p>
            </div>
          </div>
          <Link href="/login" className="btn-primary">
            <ShieldCheck className="w-4 h-4" />
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            نظام متكامل لإدارة المركز
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            مركز نوف
            <br />
            <span className="bg-gradient-to-l from-primary-600 to-accent-600 bg-clip-text text-transparent">
              لإدارة طب الأسنان
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            نظام شامل يسمح لك بإدارة المرضى والمواعيد وخطط العلاج والدفعات بكل سهولة،
            مع إمكانية وصول المريض لبياناته في أي وقت حتى بدون إنترنت.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-primary text-lg px-8 py-4 shadow-xl">
              <ShieldCheck className="w-5 h-5" />
              دخول الإدارة
            </Link>
            <Link href="/login?mode=patient" className="btn-secondary text-lg px-8 py-4">
              <User className="w-5 h-5" />
              دخول المريض
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">مميزات النظام</h2>
            <p className="text-gray-600">كل ما تحتاجه لإدارة مركز أسنانك باحترافية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="card hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 px-4 border-t border-gray-100">
        <div className="container mx-auto max-w-6xl text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} مركز نوف لطب الأسنان - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
