'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Monitor,
} from 'lucide-react';
import { Tooth } from '@/components/icons/Tooth';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
  { href: '/admin/patients', label: 'المرضى', icon: Users, exact: false },
  { href: '/admin/appointments', label: 'المواعيد', icon: Calendar, exact: false },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings, exact: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { role, loading, signOut, user } = useAuth();
  const { online, syncing, triggerSync } = useOfflineSync();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // تعطيل ميزات PWA على لوحة الإدارة
    if (typeof window !== 'undefined') {
      // إضافة كلاس يحدد أن هذه الصفحة Admin Web فقط لكي يلغي Safe Area/Mobile features من CSS
      document.body.classList.add('admin-web-mode');
      document.documentElement.classList.add('admin-web-mode');

      const metaNoPWA = document.querySelector('meta[name="admin-web-only"]');
      if (!metaNoPWA) {
        const m = document.createElement('meta');
        m.name = 'admin-web-only';
        m.content = 'true';
        document.head.appendChild(m);
      }
      // عدم السماح بمنع التكبير على لوحة الإدارة
      const adminViewport = document.createElement('meta');
      adminViewport.name = 'viewport-admin-override';
      adminViewport.setAttribute('data-admin', '1');
      // تغيير viewport ليعطي تحكم عادي للمستخدم على الكمبيوتر
      document.querySelector('meta[name="viewport"]')?.setAttribute(
        'content',
        'width=device-width, initial-scale=1'
      );
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (role !== 'admin') router.replace('/login');
  }, [role, loading, router]);

  if (loading || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside
        className={cn(
          'fixed md:sticky top-0 right-0 h-screen w-72 bg-white border-l border-gray-100 z-50 transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                <Tooth className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 leading-tight">مركز نوف</h1>
                <p className="text-xs text-gray-500">لوحة الإدارة</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                    active
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'أ'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">مدير النظام</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl px-4 py-2 text-xs font-medium">
              <Monitor className="w-4 h-4" />
              لوحة الإدارة مصممة للعمل على الكمبيوتر — للتطبيق على الجوال استخدم بوابة المريض
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerSync();
                  toast.success('جاري تحديث البيانات...');
                }}
                disabled={syncing || !online}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title={online ? 'تحديث البيانات' : 'غير متصل'}
              >
                <RefreshCw className={cn('w-4 h-4 text-gray-600', syncing && 'animate-spin')} />
              </button>
              <div
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5',
                  online ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                )}
              >
                {online ? (
                  <><Wifi className="w-3 h-3" /> متصل</>
                ) : (
                  <><WifiOff className="w-3 h-3" /> بدون إنترنت</>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
