'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  FileText,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  formatDate,
  getStatusLabel,
  cn,
} from '@/lib/utils';

export default function PatientTreatmentPage() {
  const { user } = useAuth();
  const { getPatientById } = usePatients();
  const [patient, setPatient] = useState<PatientWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      let patientId: string | null = null;

      if (!isSupabaseConfigured()) {
        patientId =
          (user.user_metadata && (user.user_metadata as any).patient_id) ||
          'demo-patient-1';
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
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 w-40 bg-gray-100 rounded mb-3" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-20 h-20 mx-auto mb-5 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">لا توجد بيانات</h2>
        <p className="text-gray-500">يرجى التواصل مع الإدارة</p>
      </div>
    );
  }

  const isOrtho = patient.treatment_type === 'orthodontics';

  if (!isOrtho) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تشخيص الطبيب</h1>
          <p className="text-gray-600 mt-1 text-sm">تتشخيص الطبيب الخاص بك</p>
        </div>

        <div className="card border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">تشخيص الطبيب</h3>
              <p className="text-xs text-gray-500">
                آخر تحديث: {patient.updated_at ? formatDate(patient.updated_at) : '—'}
              </p>
            </div>
          </div>

          {patient.diagnosis ? (
            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
              {patient.diagnosis}
            </p>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              لم يتم إضافة تشخيص بعد. سيتم عرض تشخيص الطبيب هنا فور إضافته.
            </p>
          )}
        </div>

        {patient.notes && (
          <div className="card border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> ملاحظات إضافية
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{patient.notes}</p>
          </div>
        )}
      </div>
    );
  }

  if (patient.treatment_plans.length === 0) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-20 h-20 mx-auto mb-5 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">لا توجد خطط علاج</h2>
        <p className="text-gray-500">سيتم عرض خطة العلاج الخاصة بك هنا</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">خطة العلاج</h1>
        <p className="text-gray-600 mt-1 text-sm">تابع مراحل علاجك وتقدمها</p>
      </div>

      <div className="space-y-4">
        {patient.treatment_plans.map((plan) => {
          const completedCount = plan.stages.filter((s) => s.status === 'completed').length;
          const progress = plan.stages.length > 0 ? (completedCount / plan.stages.length) * 100 : 0;
          return (
            <div key={plan.id} className="card overflow-hidden">
              <div className="mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-green-500 to-primary-500 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 min-w-[52px] text-center">
                    {completedCount}/{plan.stages.length}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-4 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  مراحل الخطة
                </p>
                <div className="relative">
                  <div className="absolute top-4 bottom-4 right-[18px] w-0.5 bg-gray-100" />
                  <div className="space-y-4">
                    {plan.stages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">لا توجد مراحل بعد</p>
                    ) : (
                      plan.stages.map((stage, idx) => {
                        const Icon =
                          stage.status === 'completed'
                            ? CheckCircle2
                            : stage.status === 'in_progress'
                            ? Clock
                            : Circle;
                        const iconBg =
                          stage.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : stage.status === 'in_progress'
                            ? 'bg-primary-100 text-primary-600 ring-4 ring-primary-50'
                            : 'bg-gray-100 text-gray-400';
                        return (
                          <div key={stage.id} className="relative flex items-start gap-4">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0',
                                iconBg
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div
                              className={cn(
                                'flex-1 rounded-xl p-4 border',
                                stage.is_current
                                  ? 'bg-primary-50/70 border-primary-200'
                                  : stage.status === 'completed'
                                  ? 'bg-green-50/40 border-green-100'
                                  : 'bg-gray-50/50 border-gray-100'
                              )}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900">{stage.name}</p>
                                {stage.is_current && (
                                  <span className="badge bg-primary-100 text-primary-700 text-[10px]">
                                    الحالية
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    'badge text-[10px]',
                                    stage.status === 'completed' && 'bg-green-100 text-green-700',
                                    stage.status === 'in_progress' && 'bg-blue-100 text-blue-700',
                                    stage.status === 'not_started' && 'bg-gray-100 text-gray-600'
                                  )}
                                >
                                  {getStatusLabel(stage.status)}
                                </span>
                              </div>
                              {stage.description && (
                                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                  {stage.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                                {stage.completed_at && (
                                  <span>
                                    اكتملت في {formatDate(stage.completed_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
