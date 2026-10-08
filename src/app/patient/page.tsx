'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Calendar,
  CreditCard,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  formatTime,
  generateArabicInitials,
  getInitialsColor,
  getStatusLabel,
} from '@/lib/utils';

export default function PatientHomePage() {
  const { user } = useAuth();
  const { getPatientById } = usePatients();
  const [patient, setPatient] = useState<PatientWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      let patientId: string | null = null;

      if (!isSupabaseConfigured()) {
        // Demo mode: get patient id from user metadata (set in useAuth demo fallback)
        patientId =
          (user.user_metadata && (user.user_metadata as any).patient_id) ||
          null;
        if (!patientId) {
          // Fallback to first demo patient for default demo patient page
          patientId = 'demo-patient-1';
        }
      } else {
        const res = await fetch('/api/patient/me');
        if (res.ok) {
          const data = await res.json();
          patientId = data.patientId;
        }
      }

      if (patientId) {
        const p = await getPatientById(patientId);
        setPatient(p);
      }
      setLoading(false);
    }
    load();
  }, [user, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 w-32 bg-gray-100 rounded mb-3" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <User className="w-20 h-20 mx-auto mb-5 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">حساب غير مفعل</h2>
        <p className="text-gray-500 mb-5">
          يرجى التواصل مع الإدارة لربط حسابك بالملف الطبي
        </p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="btn-primary"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const allPlansCost = patient.treatment_plans.reduce((s, p) => s + p.total_cost, 0);
  const totals = calculateTotals(patient.payments, allPlansCost);
  const activeStatuses = new Set(['scheduled', 'confirmed', 'pending'] as const);
  const nextAppointment = patient.appointments
    .filter((a) => activeStatuses.has(a.status as any))
    .sort(
      (a, b) =>
        new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() -
        new Date(`${b.appointment_date}T${b.appointment_time}`).getTime()
    )[0];
  const currentStage = patient.treatment_plans
    .flatMap((p) => p.stages)
    .find((s) => s.is_current);
  const completedStages = patient.treatment_plans.flatMap((p) => p.stages).filter((s) => s.status === 'completed').length;
  const totalStages = patient.treatment_plans.flatMap((p) => p.stages).length;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl border-2 border-white/30 ${getInitialsColor(
              patient.full_name
            )}`}
          >
            {generateArabicInitials(patient.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs mb-0.5">أهلاً بك،</p>
            <h1 className="font-bold text-xl truncate">{patient.full_name}</h1>
            <p className="text-white/80 text-sm mt-0.5">{patient.phone}</p>
          </div>
        </div>
      </div>

      {nextAppointment && (
        <Link href="/patient/appointments" className="block">
          <div className="card border-primary-200 bg-gradient-to-br from-primary-50/50 to-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                <Clock className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-bold">قادم</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-600 font-semibold mb-1">الموعد القادم</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatDate(nextAppointment.appointment_date)}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  الساعة {formatTime(nextAppointment.appointment_time)} · {nextAppointment.type}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary-400 shrink-0 mt-3" />
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-xs text-gray-500">المدفوع</p>
          </div>
          <p className="text-lg font-black text-green-700">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="card !p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <p className="text-xs text-gray-500">المتبقي</p>
          </div>
          <p className="text-lg font-black text-orange-700">{formatCurrency(totals.remaining)}</p>
        </div>
      </div>

      {patient.treatment_plans.length > 0 && (
        <Link href="/patient/treatment" className="block">
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-500" />
                خطة العلاج
              </h3>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {currentStage ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-primary-50 border border-primary-100 mb-4">
                <p className="text-xs font-semibold text-primary-700 mb-1.5">المرحلة الحالية</p>
                <p className="font-bold text-gray-900 text-lg">{currentStage.name}</p>
                {currentStage.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentStage.description}</p>
                )}
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">التقدم الإجمالي</span>
                <span className="font-bold text-gray-900">
                  {completedStages}/{totalStages} مرحلة
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-primary-500 via-accent-500 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: totalStages > 0 ? `${(completedStages / totalStages) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/patient/payments" className="card hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="font-semibold text-gray-900 text-sm">الحساب</p>
          <p className="text-xs text-gray-500 mt-0.5">الدفعات والباقي</p>
          <p className="font-bold text-lg text-gray-900 mt-2">{patient.payments.length} دفعة</p>
        </Link>

        <Link href="/patient/appointments" className="card hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="font-semibold text-gray-900 text-sm">المواعيد</p>
          <p className="text-xs text-gray-500 mt-0.5">القادمة والسابقة</p>
          <p className="font-bold text-lg text-gray-900 mt-2">
            {patient.appointments.length} موعد
          </p>
        </Link>

        <Link href="/patient/treatment" className="card hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="font-semibold text-gray-900 text-sm">خطط العلاج</p>
          <p className="text-xs text-gray-500 mt-0.5">المراحل والحالات</p>
          <p className="font-bold text-lg text-gray-900 mt-2">{patient.treatment_plans.length} خطة</p>
        </Link>

        <Link href="/patient/profile" className="card hover:shadow-md transition-shadow block">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          <p className="font-semibold text-gray-900 text-sm">ملفي الشخصي</p>
          <p className="text-xs text-gray-500 mt-0.5">البيانات الأساسية</p>
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-2" />
        </Link>
      </div>

      {patient.notes && (
        <div className="card border-amber-200 bg-amber-50/30">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> ملاحظات الطبيب
          </h3>
          <p className="text-sm text-amber-900/80 leading-relaxed">{patient.notes}</p>
        </div>
      )}

      <div className="text-center py-3 text-xs text-gray-400">
        <p>آخر تحديث للبيانات: {patient.updated_at ? formatDate(patient.updated_at) : '—'}</p>
      </div>
    </div>
  );
}
