'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, Bell, Database, Shield, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAppointments } from '@/hooks/useData';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { isPushSupported, isPushPermissionGranted, requestNotificationPermission, subscribeUser } from '@/lib/push-notifications';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSettingsPage() {
  const { online, lastSync, triggerSync, syncing } = useOfflineSync();
  const { refreshAdminCache } = useAppointments();
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<'unknown' | 'unsupported' | 'granted' | 'denied' | 'prompt'>('unknown');

  useEffect(() => {
    async function check() {
      if (!(await isPushSupported())) setPushStatus('unsupported');
      else if (await isPushPermissionGranted()) setPushStatus('granted');
      else setPushStatus(Notification.permission as any);
    }
    check();
  }, []);

  const enablePush = async () => {
    if (!user) return;
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      try {
        await subscribeUser(user.id);
        setPushStatus('granted');
        toast.success('تم تفعيل الإشعارات');
      } catch {
        toast.error('فشل تفعيل الإشعارات');
      }
    } else {
      setPushStatus(perm as any);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-gray-600 mt-1">إعدادات النظام والتحكم</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-600" />
          المزامنة والتخزين المحلي
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">حالة الاتصال</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {online ? 'متصل بالإنترنت' : 'غير متصل - يعرض البيانات المحفوظة محلياً'}
              </p>
            </div>
            <div className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
              online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
            >
              {online ? 'متصل' : 'غير متصل'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">آخر مزامنة</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {lastSync ? formatDate(lastSync) : 'لم تتم مزامنة بعد'}
              </p>
            </div>
            <button
              onClick={async () => {
                await triggerSync();
                await refreshAdminCache();
                toast.success('تم تحديث البيانات');
              }}
              disabled={syncing}
              className="btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              مزامنة الآن
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          الإشعارات الفورية
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">حالة الإشعارات</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {pushStatus === 'unsupported' && 'المتصفح لا يدعم الإشعارات الفورية'}
                {pushStatus === 'granted' && 'الإشعارات مفعلة على هذا الجهاز'}
                {pushStatus === 'denied' && 'الإشعارات مرفوعة من إعدادات المتصفح'}
                {pushStatus === 'prompt' && 'يمكنك تفعيل الإشعارات الآن'}
                {pushStatus === 'unknown' && 'جاري التحقق...'}
              </p>
            </div>
            {pushStatus === 'prompt' && (
              <button onClick={enablePush} className="btn-primary">
                تفعيل الإشعارات
              </button>
            )}
            {pushStatus === 'granted' && (
              <span className="badge bg-green-100 text-green-700">مفعّل</span>
            )}
            {pushStatus === 'denied' && (
              <span className="badge bg-red-100 text-red-700">موقوف</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          معلومات النظام
        </h2>
        <div className="space-y-3">
          <Info label="إصدار النظام" value="1.0.0" />
          <Info label="اسم المركز" value="مركز نوف لطب الأسنان" />
          <Info label="إصدار Next.js" value="14.1.0" />
          <Info label="قاعدة البيانات" value="Supabase PostgreSQL" />
        </div>
      </div>

      <div className="card border-amber-200 bg-amber-50/30">
        <h2 className="font-bold text-amber-800 text-lg mb-3">نصائح للنسخ الاحتياطي</h2>
        <ul className="text-sm text-amber-700 space-y-2 list-disc pr-5">
          <li>يتم اتخاذ نسخ احتياطية تلقائية لقاعدة البيانات يومياً على Supabase</li>
          <li>يمكنك تصدير بيانات المرضى بصيغة CSV من صفحة المرضى</li>
          <li>تخزين بيانات المرضى محلياً يضمن الوصول إليها حتى بدون إنترنت</li>
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
