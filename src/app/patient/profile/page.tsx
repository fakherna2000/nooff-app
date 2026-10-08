'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  StickyNote,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import {
  formatDate,
  formatPhoneNumber,
  getStatusLabel,
} from '@/lib/utils';

export default function PatientProfilePage() {
  const { user, signOut } = useAuth();
  const { getPatientById } = usePatients();
  const { online, lastSync, triggerSync } = useOfflineSync();
  const [patient, setPatient] = useState<PatientWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const res = await fetch('/api/patient/me');
      if (res.ok) {
        const data = await res.json();
        if (data.patientId) {
          const p = await getPatientById(data.patientId);
          setPatient(p);
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/70">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent || 'bg-primary-50 text-primary-600'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>
        <p className="text-gray-600 mt-1 text-sm">البيانات الشخصية وإعدادات الحساب</p>
      </div>

      {patient ? (
        <div className="bg-gradient-to-br from-primary-600 to-accent-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 text-3xl font-black">
              {patient.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-sm mb-0.5">الملف الطبي</p>
              <h2 className="text-2xl font-black truncate">{patient.full_name}</h2>
              <p className="text-white/80 text-sm mt-0.5">{patient.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 bg-amber-50 border-amber-200">
          <Shield className="w-14 h-14 mx-auto mb-3 text-amber-500" />
          <h3 className="font-bold text-amber-800 mb-1">حساب غير مرتبط</h3>
          <p className="text-sm text-amber-700/80">
            يرجى التواصل مع الإدارة لربط حسابك بالملف الطبي
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          البيانات الشخصية
        </h3>
        {patient ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={User} label="الاسم الكامل" value={patient.full_name} />
            <InfoRow icon={Phone} label="رقم الهاتف" value={formatPhoneNumber(patient.phone)} accent="bg-green-50 text-green-600" />
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={patient.email || '—'} accent="bg-blue-50 text-blue-600" />
            <InfoRow
              icon={Calendar}
              label="تاريخ الميلاد"
              value={patient.date_of_birth ? formatDate(patient.date_of_birth) : '—'}
              accent="bg-purple-50 text-purple-600"
            />
            <InfoRow
              icon={User}
              label="الجنس"
              value={patient.gender ? getStatusLabel(patient.gender) : '—'}
              accent="bg-accent-50 text-accent-600"
            />
            <InfoRow icon={MapPin} label="العنوان" value={patient.address || '—'} accent="bg-orange-50 text-orange-600" />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">لا توجد بيانات للعرض</p>
        )}
      </div>

      {patient?.medical_history && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" />
            التاريخ المرضي
          </h3>
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{patient.medical_history}</p>
          </div>
        </div>
      )}

      {patient?.notes && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            ملاحظات الطبيب
          </h3>
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{patient.notes}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary-600" />
          مزامنة البيانات والوصول بدون إنترنت
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70">
            <div>
              <p className="font-semibold text-gray-900 text-sm">آخر مزامنة ناجحة</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {lastSync ? formatDate(lastSync) : 'لا توجد بيانات محلية بعد'}
              </p>
            </div>
            <button
              onClick={() => {
                triggerSync();
                location.reload();
              }}
              className="btn-secondary !py-2 text-sm"
              disabled={!online}
            >
              <RefreshCw className="w-4 h-4" />
              مزامنة
            </button>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-sm">
            <p className="font-semibold text-blue-800 mb-1.5">💡 نصيحة</p>
            <p className="text-blue-900/80 leading-relaxed">
              يمكنك الوصول لجميع بياناتك حتى بدون إنترنت. سيتم تحديث البيانات تلقائياً عند عودة الاتصال.
              فقط تأكد من فتح التطبيق مرة واحدة أثناء الاتصال ليتم حفظ البيانات محلياً.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          معلومات الحساب
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">البريد المسجل</p>
              <p className="font-semibold text-gray-900 break-all">{user?.email || '—'}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              location.replace('/login?mode=patient');
            }}
            className="w-full py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            تسجيل الخروج من الحساب
          </button>
        </div>
      </div>
    </div>
  );
}
