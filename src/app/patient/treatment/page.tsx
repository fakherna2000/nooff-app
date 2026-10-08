'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  FileText,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import {
  calculateTotals,
  formatCurrency,
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
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 w-40 bg-gray-100 rounded mb-3" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!patient || patient.treatment_plans.length === 0) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-20 h-20 mx-auto mb-5 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">لا توجد خطط علاج</h2>
        <p className="text-gray-500">سيتم عرض خطة العلاج الخاصة بك هنا</p>
      </div>
    );
  }

  const allPlansCost = patient.treatment_plans.reduce((s, p) => s + p.total_cost, 0);
  const totals = calculateTotals(patient.payments, allPlansCost);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">خطة العلاج</h1>
        <p className="text-gray-600 mt-1 text-sm">تابع مراحل علاجك وتقدمها</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-primary-600 mb-1" />
          <p className="text-[11px] text-gray-500">الإجمالي</p>
          <p className="font-bold text-sm text-gray-900">{formatCurrency(allPlansCost)}</p>
        </div>
        <div className="card !p-3 text-center">
          <CreditCard className="w-5 h-5 mx-auto text-green-600 mb-1" />
          <p className="text-[11px] text-gray-500">المدفوع</p>
          <p className="font-bold text-sm text-green-700">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="card !p-3 text-center">
          <Clock className="w-5 h-5 mx-auto text-orange-600 mb-1" />
          <p className="text-[11px] text-gray-500">المتبقي</p>
          <p className="font-bold text-sm text-orange-700">{formatCurrency(totals.remaining)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {patient.treatment_plans.map((plan) => {
          const completedCount = plan.stages.filter((s) => s.status === 'completed').length;
          const progress = plan.stages.length > 0 ? (completedCount / plan.stages.length) * 100 : 0;
          const planTotals = calculateTotals(
            patient.payments.filter((p) => p.plan_id === plan.id),
            plan.total_cost
          );
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
                  <div className="text-left shrink-0">
                    <p className="font-bold text-primary-600 text-lg">{formatCurrency(plan.total_cost)}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      مدفوع {formatCurrency(planTotals.paid)}
                    </p>
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
                                {stage.cost && (
                                  <span className="font-semibold text-primary-600">
                                    {formatCurrency(stage.cost)}
                                  </span>
                                )}
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
