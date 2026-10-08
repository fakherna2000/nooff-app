'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Plus,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  Trash2,
  Save,
  StickyNote,
  X,
  Send,
} from 'lucide-react';
import { usePatients, useTreatmentPlans, useTreatmentStages, usePayments, useAppointments } from '@/hooks/useData';
import type { Patient, Appointment } from '@/lib/database.types';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import {
  calculateTotals,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatPhoneNumber,
  formatTime,
  generateArabicInitials,
  getInitialsColor,
  getStatusClass,
  getStatusLabel,
} from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendPushNotification } from '@/lib/push-notifications';

type TabKey = 'overview' | 'plans' | 'payments' | 'appointments' | 'edit';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const { getPatientById } = usePatients();
  const { createPlan, updatePlan, deletePlan } = useTreatmentPlans();
  const { updateStage, setCurrentStage, createStage, deleteStage } = useTreatmentStages();
  const { createPayment, deletePayment } = usePayments();
  const { createAppointment, deleteAppointment, updateAppointment } = useAppointments();

  const [patient, setPatient] = useState<PatientWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPatientById(patientId);
      setPatient(data);
      if (data && data.treatment_plans.length > 0 && expandedPlan === null) {
        setExpandedPlan(data.treatment_plans[0].id);
      }
      setLoading(false);
    }
    load();
  }, [patientId, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/patients" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> العودة لقائمة المرضى
        </Link>
        <div className="card text-center py-16">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h2 className="text-xl font-bold mb-2">لم يتم العثور على المريض</h2>
          <p className="text-gray-500">ربما تم حذفه أو لا يوجد صلاحية لعرضه</p>
        </div>
      </div>
    );
  }

  const allPlansCost = patient.treatment_plans.reduce((s, p) => s + p.total_cost, 0);
  const totals = calculateTotals(patient.payments, allPlansCost);
  const nextAppointment = patient.appointments
    .filter((a) => a.status === 'scheduled')
    .sort(
      (a, b) =>
        new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() -
        new Date(`${b.appointment_date}T${b.appointment_time}`).getTime()
    )[0];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/patients"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl ${getInitialsColor(
                patient.full_name
              )}`}
            >
              {generateArabicInitials(patient.full_name)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{patient.full_name}</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Phone className="w-4 h-4" /> {formatPhoneNumber(patient.phone)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAppointmentModal(true)} className="btn-secondary">
            <Calendar className="w-4 h-4" /> موعد جديد
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn-success">
            <CreditCard className="w-4 h-4" /> دفعة جديدة
          </button>
          <button onClick={() => setShowPlanModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> خطة علاج
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm">المدفوع</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm">المتبقي</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totals.remaining)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm">التكلفة الإجمالية</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(allPlansCost)}</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${totals.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto scrollbar-thin">
        {(
          [
            ['overview', 'نظرة عامة', User],
            ['plans', 'خطط العلاج', FileText],
            ['payments', 'الدفعات', CreditCard],
            ['appointments', 'المواعيد', Calendar],
            ['edit', 'تعديل البيانات', Edit],
          ] as [TabKey, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition-all',
              tab === key ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && (
          <OverviewTab
            patient={patient}
            totals={totals}
            nextAppointment={nextAppointment}
            allPlansCost={allPlansCost}
            onNotify={async (title, body) => {
              try {
                await sendPushNotification(patient.id, title, body);
                toast.success('تم إرسال الإشعار');
              } catch (e) {
                toast.error('فشل إرسال الإشعار');
              }
            }}
          />
        )}
        {tab === 'plans' && (
          <PlansTab
            patient={patient}
            expandedPlan={expandedPlan}
            setExpandedPlan={setExpandedPlan}
            onAddStage={setShowStageModal}
            onDeleteStage={async (id) => {
              await deleteStage(id);
              toast.success('تم حذف المرحلة');
              refresh();
            }}
            onUpdateStage={async (id, data) => {
              await updateStage(id, data);
              toast.success('تم تحديث الحالة');
              refresh();
            }}
            onSetCurrent={async (planId, stageId) => {
              await setCurrentStage(planId, stageId);
              toast.success('تم تحديد المرحلة الحالية');
              refresh();
            }}
            onDeletePlan={async (id) => {
              if (!confirm('هل أنت متأكد من حذف خطة العلاج؟')) return;
              await deletePlan(id);
              toast.success('تم حذف خطة العلاج');
              refresh();
            }}
          />
        )}
        {tab === 'payments' && (
          <PaymentsTab
            patient={patient}
            onAdd={() => setShowPaymentModal(true)}
            onDelete={async (id) => {
              if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
              await deletePayment(id);
              toast.success('تم حذف الدفعة');
              refresh();
            }}
          />
        )}
        {tab === 'appointments' && (
          <AppointmentsTab
            patient={patient}
            onAdd={() => setShowAppointmentModal(true)}
            onUpdate={async (id, data) => {
              await updateAppointment(id, data);
              toast.success('تم تحديث الموعد');
              refresh();
            }}
            onDelete={async (id) => {
              if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
              await deleteAppointment(id);
              toast.success('تم حذف الموعد');
              refresh();
            }}
          />
        )}
        {tab === 'edit' && (
          <EditPatientTab
            patient={patient}
            onSaved={() => {
              toast.success('تم تحديث البيانات');
              refresh();
              setTab('overview');
            }}
          />
        )}
      </div>

      {showPlanModal && (
        <PlanModal
          onClose={() => setShowPlanModal(false)}
          onSave={async (title, desc, cost, stages) => {
            await createPlan(
              {
                patient_id: patient.id,
                title,
                description: desc,
                total_cost: cost,
                status: 'not_started',
              },
              stages
            );
            toast.success('تمت إضافة خطة العلاج');
            setShowPlanModal(false);
            refresh();
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          plans={patient.treatment_plans}
          onClose={() => setShowPaymentModal(false)}
          onSave={async (amount, method, planId, notes, date) => {
            await createPayment({
              patient_id: patient.id,
              amount,
              payment_method: method,
              plan_id: planId || null,
              notes: notes || null,
              payment_date: date,
            } as any);
            toast.success('تمت إضافة الدفعة');
            setShowPaymentModal(false);
            refresh();
          }}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          patientId={patient.id}
          onClose={() => setShowAppointmentModal(false)}
          onSave={async (date, time, duration, type, notes) => {
            await createAppointment({
              patient_id: patient.id,
              appointment_date: date,
              appointment_time: time,
              duration_minutes: duration,
              type,
              notes: notes || null,
              status: 'scheduled',
            });
            toast.success('تم حجز الموعد');
            setShowAppointmentModal(false);
            refresh();
          }}
        />
      )}

      {showStageModal && (
        <StageModal
          planId={showStageModal}
          onClose={() => setShowStageModal(null)}
          onSave={async (name, desc, cost, orderIdx) => {
            await createStage({
              plan_id: showStageModal,
              name,
              description: desc || null,
              cost: cost || null,
              order_index: orderIdx ?? 999,
              status: 'not_started',
              is_current: false,
              completed_at: null,
            });
            toast.success('تمت إضافة المرحلة');
            setShowStageModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function OverviewTab({
  patient,
  totals,
  nextAppointment,
  allPlansCost,
  onNotify,
}: {
  patient: PatientWithAllRelations;
  totals: { paid: number; remaining: number; progress: number };
  nextAppointment?: Appointment;
  allPlansCost: number;
  onNotify: (title: string, body: string) => Promise<void>;
}) {
  const [notifyMsg, setNotifyMsg] = useState('');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-2">
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            البيانات الشخصية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={User} label="الاسم" value={patient.full_name} />
            <InfoRow icon={Phone} label="الهاتف" value={formatPhoneNumber(patient.phone)} />
            <InfoRow icon={Mail} label="البريد" value={patient.email || '—'} />
            <InfoRow icon={Calendar} label="تاريخ الميلاد" value={patient.date_of_birth ? formatDate(patient.date_of_birth) : '—'} />
            <InfoRow icon={User} label="الجنس" value={patient.gender ? getStatusLabel(patient.gender) : '—'} />
            <InfoRow icon={MapPin} label="العنوان" value={patient.address || '—'} />
          </div>
          {patient.medical_history && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-amber-500" /> التاريخ المرضي
              </p>
              <p className="text-gray-600 text-sm leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                {patient.medical_history}
              </p>
            </div>
          )}
          {patient.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" /> ملاحظات
              </p>
              <p className="text-gray-600 text-sm leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                {patient.notes}
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            خطط العلاج الحالية
          </h2>
          {patient.treatment_plans.length === 0 ? (
            <EmptyState icon={FileText} title="لا توجد خطط علاج" desc="أضف خطة علاج للمريض" />
          ) : (
            <div className="space-y-4">
              {patient.treatment_plans.slice(0, 3).map((plan) => {
                const completedCount = plan.stages.filter((s) => s.status === 'completed').length;
                const progress = plan.stages.length > 0 ? (completedCount / plan.stages.length) * 100 : 0;
                return (
                  <div key={plan.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{plan.title}</p>
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(plan.total_cost)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">
                        {completedCount}/{plan.stages.length} مرحلة
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card bg-gradient-to-br from-primary-600 to-accent-600 text-white border-0 shadow-lg">
          <h3 className="font-bold text-lg mb-4">الموعد القادم</h3>
          {nextAppointment ? (
            <div>
              <p className="text-3xl font-black mb-1">{formatTime(nextAppointment.appointment_time)}</p>
              <p className="opacity-90">{formatDate(nextAppointment.appointment_date)}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm opacity-80">نوع الزيارة</p>
                <p className="font-semibold">{nextAppointment.type}</p>
              </div>
            </div>
          ) : (
            <div className="py-4 opacity-80">
              <Calendar className="w-8 h-8 mb-2 opacity-60" />
              <p>لا توجد مواعيد قادمة</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-600" />
            إرسال إشعار
          </h3>
          <textarea
            value={notifyMsg}
            onChange={(e) => setNotifyMsg(e.target.value)}
            className="input min-h-[80px] text-sm mb-3"
            placeholder="اكتب رسالة الإشعار..."
          />
          <button
            onClick={() => {
              if (!notifyMsg.trim()) return;
              onNotify('من مركز نوف', notifyMsg);
              setNotifyMsg('');
            }}
            disabled={!notifyMsg.trim()}
            className="btn-primary w-full"
          >
            <Send className="w-4 h-4" />
            إرسال
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">الحالة المالية</h3>
          <div className="space-y-3">
            <ProgressRow label="التكلفة الإجمالية" value={formatCurrency(allPlansCost)} pct={100} color="bg-gray-400" />
            <ProgressRow label="المدفوع" value={formatCurrency(totals.paid)} pct={totals.progress} color="bg-green-500" />
            <ProgressRow label="المتبقي" value={formatCurrency(totals.remaining)} pct={Math.max(0, 100 - totals.progress)} color="bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlansTab({
  patient,
  expandedPlan,
  setExpandedPlan,
  onAddStage,
  onDeleteStage,
  onUpdateStage,
  onSetCurrent,
  onDeletePlan,
}: {
  patient: PatientWithAllRelations;
  expandedPlan: string | null;
  setExpandedPlan: (id: string | null) => void;
  onAddStage: (id: string) => void;
  onDeleteStage: (id: string) => Promise<void>;
  onUpdateStage: (id: string, data: any) => Promise<void>;
  onSetCurrent: (planId: string, stageId: string) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
}) {
  if (patient.treatment_plans.length === 0) {
    return (
      <div className="card text-center py-16">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <h2 className="text-xl font-bold mb-2">لا توجد خطط علاج</h2>
        <p className="text-gray-500">أضف خطة علاج أولية للمريض</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {patient.treatment_plans.map((plan) => {
        const isOpen = expandedPlan === plan.id;
        const completed = plan.stages.filter((s) => s.status === 'completed').length;
        const planTotals = calculateTotals(
          patient.payments.filter((p) => p.plan_id === plan.id),
          plan.total_cost
        );
        return (
          <div key={plan.id} className="card overflow-hidden">
            <div
              className="flex items-center gap-4 cursor-pointer select-none"
              onClick={() => setExpandedPlan(isOpen ? null : plan.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                  <span className="font-bold text-primary-600">{formatCurrency(plan.total_cost)}</span>
                </div>
                {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>{completed}/{plan.stages.length} مرحلة مكتملة</span>
                  <span>مدفوع: {formatCurrency(planTotals.paid)}</span>
                </div>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlan(plan.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronDown
                className={cn('w-5 h-5 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </div>
            {isOpen && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">مراحل العلاج</h4>
                  <button onClick={() => onAddStage(plan.id)} className="btn-secondary !py-2 text-sm">
                    <Plus className="w-4 h-4" /> مرحلة جديدة
                  </button>
                </div>
                {plan.stages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">لا توجد مراحل بعد</p>
                ) : (
                  <div className="relative">
                    <div className="absolute top-5 bottom-5 right-5 w-0.5 bg-gray-100" />
                    <div className="space-y-3">
                      {plan.stages.map((stage) => {
                        const Icon =
                          stage.status === 'completed'
                            ? CheckCircle2
                            : stage.status === 'in_progress'
                            ? Clock
                            : Circle;
                        return (
                          <div
                            key={stage.id}
                            className={cn(
                              'relative flex items-start gap-4 p-4 rounded-xl border transition-all',
                              stage.is_current
                                ? 'bg-primary-50 border-primary-200'
                                : 'bg-white border-gray-100 hover:bg-gray-50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0',
                                stage.status === 'completed' && 'bg-green-100 text-green-600',
                                stage.status === 'in_progress' && 'bg-blue-100 text-blue-600',
                                stage.status === 'not_started' && 'bg-gray-100 text-gray-400'
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900">{stage.name}</p>
                                {stage.is_current && (
                                  <span className="badge bg-primary-100 text-primary-700">المرحلة الحالية</span>
                                )}
                                {stage.cost && (
                                  <span className="text-xs font-bold text-primary-600">
                                    {formatCurrency(stage.cost)}
                                  </span>
                                )}
                              </div>
                              {stage.description && (
                                <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <select
                                  defaultValue={stage.status}
                                  onChange={(e) =>
                                    onUpdateStage(stage.id, {
                                      status: e.target.value as any,
                                      is_current: e.target.value === 'in_progress' ? true : undefined,
                                    })
                                  }
                                  className="!py-1.5 !px-3 text-sm input w-auto"
                                >
                                  <option value="not_started">لم تبدأ</option>
                                  <option value="in_progress">قيد التنفيذ</option>
                                  <option value="completed">مكتملة</option>
                                </select>
                                {!stage.is_current && (
                                  <button
                                    onClick={() => onSetCurrent(plan.id, stage.id)}
                                    className="btn-secondary !py-1.5 text-xs"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    اجعلها الحالية
                                  </button>
                                )}
                                <button
                                  onClick={() => onDeleteStage(stage.id)}
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentsTab({
  patient,
  onAdd,
  onDelete,
}: {
  patient: PatientWithAllRelations;
  onAdd: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const allPlansCost = patient.treatment_plans.reduce((s, p) => s + p.total_cost, 0);
  const totals = calculateTotals(patient.payments, allPlansCost);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">التكلفة الإجمالية</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(allPlansCost)}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">المدفوع</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm mb-1">المتبقي</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totals.remaining)}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">سجل الدفعات</h3>
          <button onClick={onAdd} className="btn-success text-sm !py-2">
            <Plus className="w-4 h-4" /> دفعة جديدة
          </button>
        </div>
        {patient.payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="لا توجد دفعات" desc="سجل أول دفعة للمريض" />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500">التاريخ</th>
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500">المبلغ</th>
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500">الطريقة</th>
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500">الخطة</th>
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500">ملاحظات</th>
                  <th className="py-3 px-6 text-right text-xs font-bold text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patient.payments.map((p) => {
                  const plan = patient.treatment_plans.find((pl) => pl.id === p.plan_id);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-6 text-sm text-gray-900">{formatDateShort(p.payment_date)}</td>
                      <td className="py-3 px-6 font-bold text-green-700">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-6">
                        <span className="badge bg-gray-100 text-gray-700">{getStatusLabel(p.payment_method)}</span>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700">{plan?.title || '—'}</td>
                      <td className="py-3 px-6 text-sm text-gray-500 max-w-xs truncate">{p.notes || '—'}</td>
                      <td className="py-3 px-6">
                        <button
                          onClick={() => onDelete(p.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentsTab({
  patient,
  onAdd,
  onUpdate,
  onDelete,
}: {
  patient: PatientWithAllRelations;
  onAdd: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 text-lg">المواعيد</h3>
        <button onClick={onAdd} className="btn-primary text-sm !py-2">
          <Plus className="w-4 h-4" /> موعد جديد
        </button>
      </div>
      {patient.appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="لا توجد مواعيد" desc="أضف أول موعد للمريض" />
      ) : (
        <div className="space-y-3 -m-6">
          {patient.appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex items-center gap-4 p-5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-700 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs">{formatDateShort(appt.appointment_date).split('/')[0]}</span>
                <span className="font-black text-lg leading-none">{formatTime(appt.appointment_time).split(' ')[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{appt.type}</p>
                  <span className={getStatusClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(appt.appointment_date)} - {formatTime(appt.appointment_time)}
                  {appt.duration_minutes ? ` · ${appt.duration_minutes} دقيقة` : ''}
                </p>
                {appt.notes && <p className="text-xs text-gray-400 mt-1">{appt.notes}</p>}
              </div>
              <select
                defaultValue={appt.status}
                onChange={(e) => onUpdate(appt.id, { status: e.target.value as any })}
                className="!py-2 !px-3 text-sm input w-auto"
              >
                <option value="scheduled">مجدول</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
                <option value="no_show">لم يحضر</option>
              </select>
              <button onClick={() => onDelete(appt.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditPatientTab({
  patient,
  onSaved,
}: {
  patient: PatientWithAllRelations;
  onSaved: () => void;
}) {
  const { updatePatient } = usePatients();
  const [form, setForm] = useState({
    full_name: patient.full_name,
    phone: patient.phone,
    email: patient.email || '',
    date_of_birth: patient.date_of_birth || '',
    gender: (patient.gender || '') as string,
    address: patient.address || '',
    medical_history: patient.medical_history || '',
    notes: patient.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handle = (field: string, v: any) => setForm((f) => ({ ...f, [field]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    setSaving(true);
    try {
      await updatePatient(patient.id, {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        date_of_birth: form.date_of_birth || null,
        gender: (form.gender as any) || null,
        address: form.address || null,
        medical_history: form.medical_history || null,
        notes: form.notes || null,
      });
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card">
        <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <Edit className="w-5 h-5 text-primary-600" />
          تعديل البيانات الشخصية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label">الاسم الكامل</label>
            <input className="input" value={form.full_name} onChange={(e) => handle('full_name', e.target.value)} />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input className="input" dir="ltr" value={form.phone} onChange={(e) => handle('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              className="input"
              dir="ltr"
              value={form.email}
              onChange={(e) => handle('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">تاريخ الميلاد</label>
            <input
              type="date"
              className="input"
              value={form.date_of_birth}
              onChange={(e) => handle('date_of_birth', e.target.value)}
            />
          </div>
          <div>
            <label className="label">الجنس</label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handle('gender', g)}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 font-medium',
                    form.gender === g
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600'
                  )}
                >
                  {getStatusLabel(g)}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">العنوان</label>
            <input className="input" value={form.address} onChange={(e) => handle('address', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">التاريخ المرضي</label>
            <textarea
              className="input min-h-[100px]"
              value={form.medical_history}
              onChange={(e) => handle('medical_history', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">ملاحظات</label>
            <textarea
              className="input min-h-[80px]"
              value={form.notes}
              onChange={(e) => handle('notes', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
          {saving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Save className="w-5 h-5" /> حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}

function PlanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (title: string, desc: string, cost: number, stages: { name: string; description?: string; cost?: number }[]) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [stagesText, setStagesText] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title="خطة علاج جديدة" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="label">عنوان الخطة</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تقويم أسنان كامل"
          />
        </div>
        <div>
          <label className="label">الوصف</label>
          <textarea
            className="input min-h-[80px]"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="وصف مختصر للخطة..."
          />
        </div>
        <div>
          <label className="label">التكلفة الإجمالية (ريال)</label>
          <input
            type="number"
            className="input"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">المراحل (كل مرحلة في سطر)</label>
          <textarea
            className="input min-h-[120px]"
            value={stagesText}
            onChange={(e) => setStagesText(e.target.value)}
            placeholder="فحص وتشخيص&#10;تنظيف الأسنان&#10;الخطوة الأولى من التقويم&#10;التركيب النهائي"
          />
          <p className="text-xs text-gray-500 mt-2">سيتم إنشاء المراحل تلقائياً بالترتيب أعلاه</p>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!title || saving}
          onClick={async () => {
            setSaving(true);
            const stageList = stagesText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((name) => ({ name }));
            await onSave(title, desc, Number(cost) || 0, stageList);
            setSaving(false);
          }}
        >
          {saving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Save className="w-5 h-5" /> حفظ الخطة
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function PaymentModal({
  plans,
  onClose,
  onSave,
}: {
  plans: PatientWithAllRelations['treatment_plans'];
  onClose: () => void;
  onSave: (amount: number, method: any, planId?: string, notes?: string, date?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<any>('cash');
  const [planId, setPlanId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title="دفعة جديدة" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="label">المبلغ (ريال)</label>
          <input
            type="number"
            className="input text-lg font-bold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">طريقة الدفع</label>
          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'card', 'bank_transfer', 'other'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  'py-3 rounded-xl border-2 font-medium text-sm',
                  method === m
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {getStatusLabel(m)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">خطة العلاج (اختياري)</label>
          <select className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">— بدون خطة —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({formatCurrency(p.total_cost)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">تاريخ الدفع</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea
            className="input min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اختياري..."
          />
        </div>
        <button
          className="btn-success w-full"
          disabled={!amount || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(Number(amount), method, planId, notes, date);
            setSaving(false);
          }}
        >
          {saving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <DollarSign className="w-5 h-5" /> تأكيد الدفعة
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function AppointmentModal({
  patientId,
  onClose,
  onSave,
}: {
  patientId: string;
  onClose: () => void;
  onSave: (date: string, time: string, duration: number, type: string, notes?: string) => Promise<void>;
}) {
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [time, setTime] = useState('17:00');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('فحص');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const types = ['فحص', 'تنظيف', 'حشو', 'خلع', 'تقويم', 'زراعة', 'تركيب', 'متابعة'];

  return (
    <ModalShell title="حجز موعد جديد" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="label">نوع الزيارة</label>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'px-4 py-2 rounded-xl border-2 text-sm font-medium',
                  type === t
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">التاريخ</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">الوقت</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">المدة (دقيقة)</label>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 py-3 rounded-xl border-2 font-medium text-sm',
                  duration === d
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600'
                )}
              >
                {d} د
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea
            className="input min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات إضافية..."
          />
        </div>
        <button
          className="btn-primary w-full"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(date, time, duration, type, notes);
            setSaving(false);
          }}
        >
          {saving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Calendar className="w-5 h-5" /> تأكيد الحجز
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function StageModal({
  planId,
  onClose,
  onSave,
}: {
  planId: string;
  onClose: () => void;
  onSave: (name: string, desc?: string, cost?: number, orderIdx?: number) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title="مرحلة علاج جديدة" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="label">اسم المرحلة</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">الوصف</label>
          <textarea
            className="input min-h-[80px]"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div>
          <label className="label">تكلفة المرحلة (اختياري)</label>
          <input
            type="number"
            className="input"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
        </div>
        <button
          className="btn-primary w-full"
          disabled={!name || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(name, desc, Number(cost) || undefined, 99);
            setSaving(false);
          }}
        >
          {saving ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Plus className="w-5 h-5" /> إضافة المرحلة
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
