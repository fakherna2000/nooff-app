'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Bell,
  Database,
  Shield,
  RefreshCw,
  Building2,
  Coins,
  Plus,
  Trash2,
  Save,
  Star,
  Pencil,
  X,
  Check,
  ImageIcon,
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAppointments } from '@/hooks/useData';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect, type ChangeEvent } from 'react';
import {
  isPushSupported,
  isPushPermissionGranted,
  requestNotificationPermission,
  subscribeUser,
} from '@/lib/push-notifications';
import { useAuth } from '@/hooks/useAuth';
import type {
  ClinicSettings as ClinicSettingsType,
  Currency,
  MobileAppImages,
} from '@/lib/database.types';

const MOBILE_IMAGE_FIELDS: Array<{ key: keyof MobileAppImages; label: string; hint: string }> = [
  {
    key: 'app_background_image_url',
    label: 'خلفية التطبيق (كل الصفحات)',
    hint: 'خلفية عامة تظهر داخل صفحات تطبيق المريض بعد تسجيل الدخول',
  },
  {
    key: 'login_background_image_url',
    label: 'خلفية شاشة الدخول',
    hint: 'صورة مستقلة لشاشة الدخول فقط. إذا تركتها فارغة، يستخدم التطبيق الخلفية العامة',
  },
  {
    key: 'home_hero_image_url',
    label: 'صورة هيرو الصفحة الرئيسية',
    hint: 'البطاقة الكبيرة أعلى الصفحة الرئيسية',
  },
  {
    key: 'appointments_banner_image_url',
    label: 'بانر صفحة الحجوزات',
    hint: 'البانر أعلى صفحة حجوزاتي',
  },
  {
    key: 'posts_banner_image_url',
    label: 'بانر صفحة العروض',
    hint: 'البانر أعلى صفحة العروض والمنشورات',
  },
  {
    key: 'treatment_banner_image_url',
    label: 'بانر صفحة الخدمات',
    hint: 'البانر أعلى صفحة الخدمات ورحلة العلاج',
  },
  {
    key: 'profile_background_image_url',
    label: 'خلفية بطاقة الملف الشخصي',
    hint: 'البطاقة الرئيسية في صفحة الملف الشخصي',
  },
  {
    key: 'home_service_dental_image_url',
    label: 'صورة خدمة طب الأسنان',
    hint: 'كرت الخدمة الأول في الصفحة الرئيسية',
  },
  {
    key: 'home_service_beauty_image_url',
    label: 'صورة خدمة التجميل',
    hint: 'كرت الخدمة الثاني في الصفحة الرئيسية',
  },
  {
    key: 'home_feature_whitening_image_url',
    label: 'صورة خدمة التبييض',
    hint: 'كرت الخدمات المميزة الأول',
  },
  {
    key: 'home_feature_skincare_image_url',
    label: 'صورة العناية بالبشرة',
    hint: 'كرت الخدمات المميزة الثاني',
  },
  {
    key: 'home_feature_implants_image_url',
    label: 'صورة زراعة الأسنان',
    hint: 'كرت الخدمات المميزة الثالث',
  },
  {
    key: 'treatment_feature_cleaning_image_url',
    label: 'صورة التبييض والتنظيف',
    hint: 'أول كرت في صفحة الخدمات',
  },
  {
    key: 'treatment_feature_aligners_image_url',
    label: 'صورة التقويم الشفاف',
    hint: 'ثاني كرت في صفحة الخدمات',
  },
  {
    key: 'treatment_feature_veneers_image_url',
    label: 'صورة التركيبات التجميلية',
    hint: 'ثالث كرت في صفحة الخدمات',
  },
  {
    key: 'posts_fallback_image_url',
    label: 'صورة افتراضية للمنشورات',
    hint: 'تظهر عندما لا يوجد صورة للمنشور',
  },
];

export default function AdminSettingsPage() {
  const { online, lastSync, triggerSync, syncing } = useOfflineSync();
  const { refreshAdminCache } = useAppointments();
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<
    'unknown' | 'unsupported' | 'granted' | 'denied' | 'prompt'
  >('unknown');

  // إعدادات المنشأة
  const [settings, setSettings] = useState<Partial<ClinicSettingsType>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // العملات
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: 1,
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    async function check() {
      if (!(await isPushSupported())) setPushStatus('unsupported');
      else if (await isPushPermissionGranted()) setPushStatus('granted');
      else setPushStatus(Notification.permission as any);
    }
    check();
    loadSettings();
    loadCurrencies();
  }, []);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.data) setSettings(data.data);
    } catch {
      toast.error('فشل تحميل الإعدادات');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const res = await fetch('/api/admin/currencies');
      const data = await res.json();
      if (res.ok && data.data) setCurrencies(data.data);
    } catch {
      toast.error('فشل تحميل العملات');
    }
  };

  const mobileImages = (settings.mobile_images || {}) as MobileAppImages;

  const updateMobileImage = (key: keyof MobileAppImages, value: string) => {
    setSettings((prev) => ({
      ...prev,
      mobile_images: {
        ...((prev.mobile_images || {}) as MobileAppImages),
        [key]: value,
      },
    }));
  };

  const persistSettings = async (
    nextSettings: Partial<ClinicSettingsType>,
    successMessage = 'تم حفظ الإعدادات'
  ) => {
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSettings(data.data);
        toast.success(successMessage);
        return true;
      } else {
        toast.error(data.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('فشل الحفظ');
    } finally {
      setSettingsSaving(false);
    }
    return false;
  };

  const saveSettings = async () => {
    await persistSettings(settings);
  };

  const handleImageUpload = async (
    key: keyof MobileAppImages,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImageKey(String(key));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', String(key));

      const uploadRes = await fetch('/api/admin/settings/upload-image', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.data?.publicUrl) {
        toast.error(uploadData.error || 'فشل رفع الصورة');
        return;
      }

      const nextSettings: Partial<ClinicSettingsType> = {
        ...settings,
        mobile_images: {
          ...((settings.mobile_images || {}) as MobileAppImages),
          [key]: uploadData.data.publicUrl,
        },
      };

      setSettings(nextSettings);
      await persistSettings(nextSettings, 'تم رفع الصورة وحفظها');
    } catch {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploadingImageKey(null);
      event.target.value = '';
    }
  };

  const clearMobileImage = async (key: keyof MobileAppImages) => {
    const nextSettings: Partial<ClinicSettingsType> = {
      ...settings,
      mobile_images: {
        ...((settings.mobile_images || {}) as MobileAppImages),
        [key]: '',
      },
    };

    setSettings(nextSettings);
    await persistSettings(nextSettings, 'تم حذف الصورة من الإعدادات');
  };

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

  const openCurrencyModal = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
      setCurrencyForm({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        exchange_rate: currency.exchange_rate,
        is_default: currency.is_default,
        is_active: currency.is_active,
      });
    } else {
      setEditingCurrency(null);
      setCurrencyForm({
        code: '',
        name: '',
        symbol: '',
        exchange_rate: 1,
        is_default: false,
        is_active: true,
      });
    }
    setShowCurrencyModal(true);
  };

  const saveCurrency = async () => {
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    try {
      const url = editingCurrency
        ? `/api/admin/currencies/${editingCurrency.id}`
        : '/api/admin/currencies';
      const method = editingCurrency ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currencyForm),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        toast.success('تم حفظ العملة');
        setShowCurrencyModal(false);
        loadCurrencies();
        loadSettings();
      } else {
        toast.error(data.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('فشل الحفظ');
    }
  };

  const deleteCurrency = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return;
    try {
      const res = await fetch(`/api/admin/currencies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف العملة');
        loadCurrencies();
        loadSettings();
      } else {
        toast.error('فشل الحذف');
      }
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const setDefaultCurrency = async (currency: Currency) => {
    try {
      const res = await fetch(`/api/admin/currencies/${currency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currency, is_default: true }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        toast.success('تم تعيين العملة كافتراضية');
        loadCurrencies();
        loadSettings();
      } else {
        toast.error(data.error || 'فشل التحديث');
      }
    } catch {
      toast.error('فشل التحديث');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            الإعدادات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إعدادات المنشأة والثيم والعملات
          </p>
        </div>
      </div>

      {/* إعدادات المنشأة */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          بيانات المنشأة
        </h2>
        {settingsLoading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="اسم العيادة">
              <input
                className="input"
                value={settings.clinic_name || ''}
                onChange={(e) => setSettings({ ...settings, clinic_name: e.target.value })}
              />
            </Field>
            <Field label="العملة الافتراضية">
              <select
                className="input"
                value={settings.currency_id || ''}
                onChange={(e) =>
                  setSettings({ ...settings, currency_id: e.target.value })
                }
              >
                <option value="">اختر العملة</option>
                {currencies
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="الهاتف">
              <input
                className="input"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <input
                className="input"
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </Field>
            <Field label="العنوان">
              <input
                className="input"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </Field>
            <Field label="رابط الشعار">
              <input
                className="input"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button onClick={saveSettings} disabled={settingsSaving} className="btn-primary">
                <Save className="w-4 h-4" />
                {settingsSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary-600" />
          صور تطبيق المريض
        </h2>
        {settingsLoading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOBILE_IMAGE_FIELDS.map((field) => {
                const value = mobileImages[field.key] || '';

                return (
                  <div
                    key={field.key}
                    className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-800/40"
                  >
                    <label className="label">{field.label}</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{field.hint}</p>
                    <input
                      className="input"
                      value={value}
                      onChange={(e) => updateMobileImage(field.key, e.target.value)}
                      placeholder="https://..."
                      dir="ltr"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium cursor-pointer hover:bg-primary-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(field.key, e)}
                          disabled={settingsSaving || uploadingImageKey === field.key}
                        />
                        {uploadingImageKey === field.key ? 'جاري الرفع...' : 'رفع من الجهاز'}
                      </label>
                      <button
                        type="button"
                        onClick={() => clearMobileImage(field.key)}
                        disabled={!value || settingsSaving || uploadingImageKey === field.key}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
                      >
                        حذف الصورة
                      </button>
                    </div>
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-28 flex items-center justify-center">
                      {value ? (
                        <img
                          src={value}
                          alt={field.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500">لا توجد صورة</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={saveSettings} disabled={settingsSaving} className="btn-primary">
                <Save className="w-4 h-4" />
                {settingsSaving ? 'جاري الحفظ...' : 'حفظ صور التطبيق'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* إدارة العملات */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary-600" />
            إدارة العملات
          </h2>
          <button onClick={() => openCurrencyModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            إضافة عملة
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-right">
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">الاسم</th>
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">الرمز</th>
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">الكود</th>
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">سعر الصرف</th>
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                <th className="py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-2 text-gray-900 dark:text-gray-100 font-medium">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Star className="w-3 h-3" /> افتراضية
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{c.symbol}</td>
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{c.code}</td>
                  <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{c.exchange_rate}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`badge ${
                        c.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {c.is_active ? 'مفعلة' : 'معطلة'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {!c.is_default && (
                        <button
                          onClick={() => setDefaultCurrency(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors"
                          title="تعيين كافتراضية"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openCurrencyModal(c)}
                        className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors"
                        title="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCurrency(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* المزامنة والتخزين المحلي */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-600" />
          المزامنة والتخزين المحلي
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">حالة الاتصال</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {online ? 'متصل بالإنترنت' : 'غير متصل - يعرض البيانات المحفوظة محلياً'}
              </p>
            </div>
            <div
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                online
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {online ? 'متصل' : 'غير متصل'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">آخر مزامنة</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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

      {/* الإشعارات الفورية */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          الإشعارات الفورية
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">حالة الإشعارات</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                مفعّل
              </span>
            )}
            {pushStatus === 'denied' && (
              <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                موقوف
              </span>
            )}
          </div>
        </div>
      </div>

      {/* معلومات النظام */}
      <div className="card">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          معلومات النظام
        </h2>
        <div className="space-y-3">
          <Info label="إصدار النظام" value="1.0.0" />
          <Info label="اسم المركز" value={settings.clinic_name || 'مركز نوف لطب الأسنان'} />
          <Info label="إصدار Next.js" value="14.1.0" />
          <Info label="قاعدة البيانات" value="Supabase PostgreSQL" />
        </div>
      </div>

      {/* نصائح للنسخ الاحتياطي */}
      <div className="card border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
        <h2 className="font-bold text-amber-800 dark:text-amber-400 text-lg mb-3">
          نصائح للنسخ الاحتياطي
        </h2>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-disc pr-5">
          <li>يتم اتخاذ نسخ احتياطية تلقائية لقاعدة البيانات يومياً على Supabase</li>
          <li>يمكنك تصدير بيانات المرضى بصيغة CSV من صفحة المرضى</li>
          <li>تخزين بيانات المرضى محلياً يضمن الوصول إليها حتى بدون إنترنت</li>
        </ul>
      </div>

      {/* Modal إضافة/تعديل عملة */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {editingCurrency ? 'تعديل العملة' : 'إضافة عملة جديدة'}
              </h3>
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="اسم العملة">
                <input
                  className="input"
                  value={currencyForm.name}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                  placeholder="ريال سعودي"
                />
              </Field>
              <Field label="الرمز">
                <input
                  className="input"
                  value={currencyForm.symbol}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                  placeholder="ر.س"
                />
              </Field>
              <Field label="الكود (ISO)">
                <input
                  className="input"
                  value={currencyForm.code}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
                  placeholder="SAR"
                />
              </Field>
              <Field label="سعر الصرف (مقارنة بالعملة الافتراضية)">
                <input
                  className="input"
                  type="number"
                  step="0.0001"
                  value={currencyForm.exchange_rate}
                  onChange={(e) =>
                    setCurrencyForm({ ...currencyForm, exchange_rate: parseFloat(e.target.value) || 1 })
                  }
                />
              </Field>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={currencyForm.is_default}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                  تعيين كعملة افتراضية
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={currencyForm.is_active}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  عملة مفعلة
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="btn-secondary flex-1"
              >
                إلغاء
              </button>
              <button onClick={saveCurrency} className="btn-primary flex-1">
                <Check className="w-4 h-4" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
