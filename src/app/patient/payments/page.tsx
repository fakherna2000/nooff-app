'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  CreditCard,
  DollarSign,
  Banknote,
  Landmark,
  MoreHorizontal,
} from 'lucide-react';
import {
  calculateTotals,
  formatCurrency,
  formatDateShort,
  getStatusLabel,
  cn,
} from '@/lib/utils';

export default function PatientPaymentsPage() {
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
        <div className="h-40 card animate-pulse" />
        <div className="card animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const allPlansCost = patient.treatment_plans.reduce((s, p) => s + p.total_cost, 0);
  const totals = calculateTotals(patient.payments, allPlansCost);
  const progressPct = allPlansCost > 0 ? Math.min(100, (totals.paid / allPlansCost) * 100) : 0;

  const methodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'bank_transfer':
        return <Landmark className="w-5 h-5" />;
      default:
        return <MoreHorizontal className="w-5 h-5" />;
    }
  };
  const methodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-700';
      case 'card':
        return 'bg-blue-100 text-blue-700';
      case 'bank_transfer':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الحساب المالي</h1>
        <p className="text-gray-600 mt-1 text-sm">الدفعات والمبالغ المالية</p>
      </div>

      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm mb-1">التكلفة الإجمالية للعلاج</p>
            <p className="text-3xl font-black">{formatCurrency(allPlansCost)}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
            <CreditCard className="w-7 h-7" />
          </div>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-5 backdrop-blur-sm">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000 shadow-lg"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign className="w-4 h-4 text-green-200" />
              <p className="text-xs text-white/70">المدفوع</p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totals.paid)}</p>
            <p className="text-[11px] text-white/60 mt-0.5">{progressPct.toFixed(0)}% من الإجمالي</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <CreditCard className="w-4 h-4 text-orange-200" />
              <p className="text-xs text-white/70">المتبقي</p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(totals.remaining)}</p>
            <p className="text-[11px] text-white/60 mt-0.5">
              {(100 - progressPct).toFixed(0)}% المتبقية
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary-600" />
          سجل الدفعات
        </h3>
        {patient.payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">لا توجد دفعات مسجلة</p>
            <p className="text-sm mt-1">سيتم عرض سجل المدفوعات هنا</p>
          </div>
        ) : (
          <div className="space-y-3 -mx-2">
            {patient.payments.map((payment) => {
              const plan = patient.treatment_plans.find((p) => p.id === payment.plan_id);
              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                      methodColor(payment.payment_method)
                    )}
                  >
                    {methodIcon(payment.payment_method)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-lg">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">
                        {getStatusLabel(payment.payment_method)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>{formatDateShort(payment.payment_date)}</span>
                      {plan && (
                        <>
                          <span>·</span>
                          <span className="truncate">{plan.title}</span>
                        </>
                      )}
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{payment.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card border-amber-200 bg-amber-50/30">
        <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-1.5 text-sm">
          <CreditCard className="w-4 h-4" /> معلومات الدفع
        </h3>
        <p className="text-sm text-amber-900/80 leading-relaxed">
          يتم الدفع حالياً مباشرة في العيادة. قريباً سيتم تفعيل الدفع الإلكتروني من خلال البطاقة البنكية
          والتحويلات البنكية.
        </p>
      </div>
    </div>
  );
}
