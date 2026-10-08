'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FileText,
  CreditCard,
  Calendar,
  User,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Download,
  X,
  Smartphone,
} from 'lucide-react';
import { Tooth } from '@/components/icons/Tooth';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isPushSupported, isPushPermissionGranted, requestNotificationPermission, subscribeUser } from '@/lib/push-notifications';

const navItems = [
  { href: '/patient', label: 'الرئيسية', icon: Home },
  { href: '/patient/treatment', label: 'خطة العلاج', icon: FileText },
  { href: '/patient/payments', label: 'الحساب', icon: CreditCard },
  { href: '/patient/appointments', label: 'المواعيد', icon: Calendar },
  { href: '/patient/profile', label: 'حسابي', icon: User },
];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PatientLayout({ children }: { children: ReactNode }) {
  const { role, loading, signOut, user } = useAuth();
  const { online, syncing, triggerSync } = useOfflineSync();
  const router = useRouter();
  const pathname = usePathname();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // تعليم CSS أن هذا هو وضع تطبيق المريض الموبايل (لتفعيل Safe Area وتحسينات الجوال)
    if (typeof window !== 'undefined') {
      document.body.classList.add('patient-app-mode');
      document.documentElement.classList.add('patient-app-mode');
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (role !== 'patient') router.replace('/login?mode=patient');
  }, [role, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function check() {
      if ((await isPushSupported()) && !(await isPushPermissionGranted()) && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        setTimeout(() => setShowPushPrompt(true), 3000);
      }
    }
    check();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstall(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('noof_install_dismissed');
      const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone =
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
      if (!alreadyInstalled && !iosStandalone && !dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 5000);
      }
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (loading || role !== 'patient') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج');
    router.replace('/login?mode=patient');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 pt-safe">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm">
              <Tooth className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">مركز نوف</h1>
              <p className="text-[11px] text-gray-500 leading-tight">البوابة الإلكترونية</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerSync();
                toast.message('جاري تحديث بياناتك...');
              }}
              disabled={syncing || !online}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              title={online ? 'تحديث البيانات' : 'غير متصل'}
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-600', syncing && 'animate-spin')} />
            </button>
            <div
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1',
                online ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              )}
            >
              {online ? <><Wifi className="w-3 h-3" /> متصل</> : <><WifiOff className="w-3 h-3" /> بدون إنترنت</>}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-3xl mx-auto">{children}</main>

      <nav className="fixed z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] left-0 right-0 bottom-safe-nav pb-safe">
        <div className="max-w-3xl mx-auto px-2">
          <div className="grid grid-cols-5">
            {navItems.map((item) => {
              const active = isClient
                ? item.href === '/patient'
                  ? pathname === '/patient'
                  : pathname?.startsWith(item.href) ?? false
                : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl transition-all',
                    active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', active && 'scale-110 transition-transform')} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-primary-600 mt-0.5" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showPushPrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900">تفعيل الإشعارات</h4>
                <p className="text-sm text-gray-500 mt-1">
                  لاستقبال تذكيرات المواعيد وتحديثات خطة العلاج مباشرة على هاتفك
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowPushPrompt(false)}
                    className="btn-secondary flex-1 !py-2.5 text-sm"
                  >
                    لاحقاً
                  </button>
                  <button
                    onClick={async () => {
                      setShowPushPrompt(false);
                      const perm = await requestNotificationPermission();
                      if (perm === 'granted' && user) {
                        try {
                          await subscribeUser(user.id);
                          toast.success('تم تفعيل الإشعارات بنجاح');
                        } catch {}
                      }
                    }}
                    className="btn-primary flex-1 !py-2.5 text-sm"
                  >
                    تفعيل
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstallPrompt && !isInstalled && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-6 text-white text-center relative">
              <button
                onClick={() => {
                  localStorage.setItem('noof_install_dismissed', '1');
                  setShowInstallPrompt(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border-2 border-white/30 shadow-xl">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-1">ثبّت مركز نوف على هاتفك</h3>
              <p className="text-white/80 text-sm">
                الوصول السريع بدون متصفح + إشعارات فورية + أوضاع ملء الشاشة
              </p>
            </div>
            <div className="p-6 space-y-4">
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">✓</span>
                  أيقونة التطبيق مباشرة على الشاشة الرئيسية
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">✓</span>
                  يعمل بدون إنترنت بعد أول دخول
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">✓</span>
                  إشعارات فورية بتذكير المواعيد والحساب
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">✓</span>
                  فتح ملء الشاشة مثل أي تطبيق أصلي
                </li>
              </ul>

              {deferredInstall ? (
                <button
                  onClick={async () => {
                    try {
                      await deferredInstall.prompt();
                      const choice = await deferredInstall.userChoice;
                      if (choice.outcome === 'accepted') {
                        toast.success('جاري تثبيت التطبيق...');
                      }
                    } catch {}
                    setShowInstallPrompt(false);
                    setDeferredInstall(null);
                  }}
                  className="w-full btn-primary !py-3.5 text-base flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  تثبيت التطبيق الآن
                </button>
              ) : (
                <div className="space-y-3 text-center text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="font-semibold text-amber-800">
                    على آيفون (iOS):
                  </p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    اضغط أيقونة المشاركة ⬆ في شريط المتصفح ثم اختر
                    <span className="font-bold mx-1">&ldquo;إضافة إلى الشاشة الرئيسية&rdquo;</span>
                    ثم &ldquo;إضافة&rdquo;
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  localStorage.setItem('noof_install_dismissed', '1');
                  setShowInstallPrompt(false);
                }}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
              >
                ليس الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
