'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useCallback } from 'react';
import type {
  Patient,
  TreatmentPlan,
  TreatmentStage,
  Payment,
  Appointment,
} from '@/lib/database.types';
import {
  syncPatientDataWithServer,
  getPatientDataOffline,
  getAdminDataOffline,
  saveAllAdminDataOffline,
  isOnline as checkOnline,
  type PatientWithAllRelations,
} from '@/lib/offline-db';

const supabase = createClient() as any;
const demoMode = () => !isSupabaseConfigured();

const todayISO = () => new Date().toISOString().split('T')[0];
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

const DEMO_PATIENTS: Patient[] = [
  {
    id: 'demo-patient-1',
    user_id: 'demo-patient-uuid',
    full_name: 'سارة أحمد',
    phone: '+971501234567',
    email: 'patient@noof.com',
    date_of_birth: '1995-03-15',
    gender: 'female',
    address: 'دبي، الشارقة، عين جالوت',
    medical_history: 'لا يعاني من أمراض مزمنة',
    allergies: 'لا توجد',
    notes: 'مريضة منتظمة للزيارات',
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2026-10-01T09:20:00Z',
  },
  {
    id: 'demo-patient-2',
    user_id: 'demo-user-2',
    full_name: 'محمد سعيد',
    phone: '+971509988776',
    email: 'mohammed@noof.com',
    date_of_birth: '1988-07-22',
    gender: 'male',
    address: 'أبو ظبي، خليفة سيتي',
    medical_history: 'ضغط دم مرتفع',
    allergies: 'البنسلين',
    notes: 'يعاني من رهاب الأسنان',
    created_at: '2025-08-10T08:30:00Z',
    updated_at: '2026-09-28T12:00:00Z',
  },
  {
    id: 'demo-patient-3',
    user_id: 'demo-user-3',
    full_name: 'فاطمة علي',
    phone: '+971505511223',
    email: 'fatima@noof.com',
    date_of_birth: '1999-12-05',
    gender: 'female',
    address: 'الشارقة، النعيمية',
    medical_history: 'سليمة',
    allergies: 'لا توجد',
    notes: 'طلبت تقويم أسنان',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-10-05T15:00:00Z',
  },
  {
    id: 'demo-patient-4',
    user_id: 'demo-user-4',
    full_name: 'خالد عبدالله',
    phone: '+971507788990',
    email: 'khaled@noof.com',
    date_of_birth: '1980-05-10',
    gender: 'male',
    address: 'دبي، بني ياس',
    medical_history: 'داء السكري من النوع 2',
    allergies: 'لا توجد',
    notes: 'يتطلب زيارات طويلة',
    created_at: '2025-11-20T14:00:00Z',
    updated_at: '2026-09-15T10:30:00Z',
  },
  {
    id: 'demo-patient-5',
    user_id: 'demo-user-5',
    full_name: 'نورة حسن',
    phone: '+971503344556',
    email: 'noura@noof.com',
    date_of_birth: '1992-08-18',
    gender: 'female',
    address: 'العين، الجيمي',
    medical_history: 'سليمة',
    allergies: 'الليدوكايين',
    notes: 'نظافة أسنان ممتازة',
    created_at: '2026-02-20T09:15:00Z',
    updated_at: '2026-10-03T08:45:00Z',
  },
];

const DEMO_APPOINTMENTS: (Appointment & { patients?: { full_name: string; phone: string } })[] = [
  {
    id: 'apt-1',
    patient_id: 'demo-patient-1',
    appointment_date: todayISO(),
    appointment_time: '10:30',
    duration_minutes: 45,
    status: 'confirmed',
    type: 'checkup',
    notes: 'فحص دوري',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    patients: { full_name: 'سارة أحمد', phone: '+971501234567' },
  },
  {
    id: 'apt-2',
    patient_id: 'demo-patient-2',
    appointment_date: todayISO(),
    appointment_time: '14:00',
    duration_minutes: 60,
    status: 'confirmed',
    type: 'filling',
    notes: 'حشوة ضرس علوي أيمن',
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
    patients: { full_name: 'محمد سعيد', phone: '+971509988776' },
  },
  {
    id: 'apt-3',
    patient_id: 'demo-patient-3',
    appointment_date: daysFromNow(1),
    appointment_time: '09:00',
    duration_minutes: 30,
    status: 'pending',
    type: 'consultation',
    notes: 'استشارة تقويم',
    created_at: '2026-10-03T12:00:00Z',
    updated_at: '2026-10-03T12:00:00Z',
    patients: { full_name: 'فاطمة علي', phone: '+971505511223' },
  },
  {
    id: 'apt-4',
    patient_id: 'demo-patient-4',
    appointment_date: daysFromNow(2),
    appointment_time: '15:30',
    duration_minutes: 90,
    status: 'confirmed',
    type: 'implant',
    notes: 'زراعة غرسة سفلية وسطى',
    created_at: '2026-09-28T09:00:00Z',
    updated_at: '2026-09-28T09:00:00Z',
    patients: { full_name: 'خالد عبدالله', phone: '+971507788990' },
  },
  {
    id: 'apt-5',
    patient_id: 'demo-patient-5',
    appointment_date: daysFromNow(3),
    appointment_time: '11:00',
    duration_minutes: 30,
    status: 'confirmed',
    type: 'cleaning',
    notes: 'تنظيف وتلميع',
    created_at: '2026-10-04T13:00:00Z',
    updated_at: '2026-10-04T13:00:00Z',
    patients: { full_name: 'نورة حسن', phone: '+971503344556' },
  },
  {
    id: 'apt-6',
    patient_id: 'demo-patient-1',
    appointment_date: daysFromNow(7),
    appointment_time: '12:00',
    duration_minutes: 60,
    status: 'pending',
    type: 'root_canal',
    notes: 'معالجة عصب ضرس سفلي',
    created_at: '2026-10-05T10:30:00Z',
    updated_at: '2026-10-05T10:30:00Z',
    patients: { full_name: 'سارة أحمد', phone: '+971501234567' },
  },
];

const DEMO_PLANS: (TreatmentPlan & { stages: TreatmentStage[] })[] = [
  {
    id: 'plan-1',
    patient_id: 'demo-patient-1',
    title: 'خطة تجميلية ابتسامة',
    name: 'خطة تجميلية ابتسامة',
    description: 'تقويم شفاف + تبييض ليزر + قشور خزفية للأسنان الأمامية العلوية',
    total_cost: 18500,
    status: 'in_progress',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-10-01T11:00:00Z',
    stages: [
      {
        id: 'stg-1-1',
        plan_id: 'plan-1',
        name: 'الفحص الأول والتصوير',
        description: 'أشعة بانوراما + صور سريرية + قياسات',
        cost: 600,
        order_index: 0,
        status: 'completed',
        is_current: false,
        completed_at: '2026-08-05T10:30:00Z',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-05T10:30:00Z',
      },
      {
        id: 'stg-1-2',
        plan_id: 'plan-1',
        name: 'تبييض ليزر',
        description: 'جلسة تبييض بأشعة الباردة',
        cost: 1800,
        order_index: 1,
        status: 'completed',
        is_current: false,
        completed_at: '2026-09-02T14:00:00Z',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-09-02T14:00:00Z',
      },
      {
        id: 'stg-1-3',
        plan_id: 'plan-1',
        name: 'القوالب الشفافة - الشهر الأول',
        description: 'تركيب القوالب الـ 1 إلى الـ 6',
        cost: 5000,
        order_index: 2,
        status: 'in_progress',
        is_current: true,
        completed_at: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-10-01T11:00:00Z',
      },
      {
        id: 'stg-1-4',
        plan_id: 'plan-1',
        name: 'قشور خزفية 6 وحدات',
        description: 'أصابع الأسنان الأمامية العلوية من المولر الأول',
        cost: 9600,
        order_index: 3,
        status: 'not_started',
        is_current: false,
        completed_at: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'stg-1-5',
        plan_id: 'plan-1',
        name: 'زيارة متابعة نهائية',
        description: 'فحص بعد جميع الإجراءات وتسجيل',
        cost: 1500,
        order_index: 4,
        status: 'not_started',
        is_current: false,
        completed_at: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
    ],
  },
];

const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    patient_id: 'demo-patient-1',
    plan_id: 'plan-1',
    amount: 2400,
    payment_date: '2026-08-05',
    payment_method: 'cash',
    method: 'cash',
    status: 'paid',
    notes: 'دفع العربون والفحص',
    created_at: '2026-08-05T10:45:00Z',
  },
  {
    id: 'pay-2',
    patient_id: 'demo-patient-1',
    plan_id: 'plan-1',
    amount: 5000,
    payment_date: '2026-09-02',
    payment_method: 'card',
    method: 'card',
    status: 'paid',
    notes: 'قسط التبييض والقالب الأول',
    created_at: '2026-09-02T14:30:00Z',
  },
  {
    id: 'pay-3',
    patient_id: 'demo-patient-1',
    plan_id: 'plan-1',
    amount: 3000,
    payment_date: todayISO(),
    payment_method: 'bank_transfer',
    method: 'bank_transfer',
    status: 'pending',
    notes: 'قسط الشهر الثالث (القوالب)',
    created_at: '2026-10-07T08:00:00Z',
  },
];

export function usePatients() {
  const searchPatients = useCallback(async (query: string) => {
    if (demoMode()) {
      const q = query.trim().toLowerCase();
      return DEMO_PATIENTS.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) || p.phone.includes(q)
      );
    }
    const online = await checkOnline();
    if (!online) {
      const { patients } = await getAdminDataOffline();
      return patients.filter(
        (p) =>
          p.full_name.includes(query) ||
          p.phone.includes(query)
      );
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as Patient[];
  }, []);

  const getAllPatients = useCallback(async () => {
    if (demoMode()) return DEMO_PATIENTS;
    const online = await checkOnline();
    if (!online) {
      return (await getAdminDataOffline()).patients;
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Patient[];
  }, []);

  const getPatientById = useCallback(async (id: string): Promise<PatientWithAllRelations | null> => {
    if (demoMode()) {
      const patient = DEMO_PATIENTS.find((p) => p.id === id);
      if (!patient) return null;
      const plans = DEMO_PLANS.filter((p) => p.patient_id === id);
      return {
        ...patient,
        treatment_plans: plans,
        payments: DEMO_PAYMENTS.filter((p) => p.patient_id === id),
        appointments: DEMO_APPOINTMENTS.filter((a) => a.patient_id === id).map(
          ({ patients, ...a }) => a as Appointment
        ),
      };
    }
    const online = await checkOnline();

    if (online) {
      const synced = await syncPatientDataWithServer(supabase, id);
      if (synced) return synced;
    }
    return await getPatientDataOffline(id);
  }, []);

  const createPatient = useCallback(
    async (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
      if (demoMode()) {
        const newPatient: Patient = {
          ...patientData,
          id: 'demo-new-' + rand(1000, 9999),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        DEMO_PATIENTS.unshift(newPatient);
        return newPatient;
      }
      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    []
  );

  const updatePatient = useCallback(
    async (id: string, patientData: Partial<Patient>) => {
      if (demoMode()) {
        const idx = DEMO_PATIENTS.findIndex((p) => p.id === id);
        if (idx >= 0) {
          DEMO_PATIENTS[idx] = { ...DEMO_PATIENTS[idx], ...patientData, updated_at: new Date().toISOString() };
          return DEMO_PATIENTS[idx];
        }
        throw new Error('المريض غير موجود');
      }
      const { data, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    []
  );

  const deletePatient = useCallback(async (id: string) => {
    if (demoMode()) {
      const idx = DEMO_PATIENTS.findIndex((p) => p.id === id);
      if (idx >= 0) DEMO_PATIENTS.splice(idx, 1);
      return { error: null };
    }
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    searchPatients,
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
  };
}

export function useTreatmentPlans() {
  const createPlan = useCallback(
    async (
      planData: Omit<TreatmentPlan, 'id' | 'created_at' | 'updated_at'>,
      stages: { name: string; description?: string | null; cost?: number | null }[]
    ) => {
      if (demoMode()) {
        const planId = 'demo-plan-' + rand(1000, 9999);
        const newPlan: TreatmentPlan & { stages: TreatmentStage[] } = {
          ...planData,
          id: planId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stages: stages.map((s, idx) => ({
            id: 'demo-stg-' + rand(10000, 99999),
            plan_id: planId,
            name: s.name,
            description: s.description ?? null,
            cost: s.cost ?? null,
            order_index: idx,
            status: idx === 0 ? 'in_progress' : 'not_started',
            is_current: idx === 0,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        };
        DEMO_PLANS.push(newPlan);
        return newPlan as TreatmentPlan;
      }
      const { data: plan, error: planError } = await supabase
        .from('treatment_plans')
        .insert(planData)
        .select()
        .single();

      if (planError) throw planError;

      if (stages.length > 0) {
        const stagesWithPlanId: Omit<TreatmentStage, 'id' | 'created_at' | 'updated_at'>[] = stages.map((s, idx) => ({
          plan_id: plan.id,
          name: s.name,
          description: s.description ?? null,
          cost: s.cost ?? null,
          order_index: idx,
          status: idx === 0 ? 'in_progress' : 'not_started',
          is_current: idx === 0,
          completed_at: null,
        }));
        const { error: stagesError } = await supabase
          .from('treatment_stages')
          .insert(stagesWithPlanId);
        if (stagesError) throw stagesError;
      }

      return plan;
    },
    []
  );

  const updatePlan = useCallback(
    async (id: string, planData: Partial<TreatmentPlan>) => {
      if (demoMode()) {
        const idx = DEMO_PLANS.findIndex((p) => p.id === id);
        if (idx >= 0) {
          DEMO_PLANS[idx] = { ...DEMO_PLANS[idx], ...planData, updated_at: new Date().toISOString() };
          return DEMO_PLANS[idx] as TreatmentPlan;
        }
        throw new Error('الخطة غير موجودة');
      }
      const { data, error } = await supabase
        .from('treatment_plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  const deletePlan = useCallback(async (id: string) => {
    if (demoMode()) {
      const idx = DEMO_PLANS.findIndex((p) => p.id === id);
      if (idx >= 0) DEMO_PLANS.splice(idx, 1);
      return { error: null };
    }
    const { error } = await supabase.from('treatment_plans').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    createPlan,
    updatePlan,
    deletePlan,
  };
}

export function useTreatmentStages() {
  const updateStage = useCallback(
    async (id: string, stageData: Partial<TreatmentStage>) => {
      if (stageData.status === 'completed' && !stageData.completed_at) {
        stageData.completed_at = new Date().toISOString();
      }
      if (demoMode()) {
        for (const plan of DEMO_PLANS) {
          const idx = plan.stages.findIndex((s) => s.id === id);
          if (idx >= 0) {
            plan.stages[idx] = { ...plan.stages[idx], ...stageData, updated_at: new Date().toISOString() } as TreatmentStage;
            if (stageData.is_current) {
              plan.stages.forEach((s, i) => { if (i !== idx) s.is_current = false; });
            }
            return plan.stages[idx] as TreatmentStage;
          }
        }
        throw new Error('المرحلة غير موجودة');
      }
      const { data, error } = await supabase
        .from('treatment_stages')
        .update(stageData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (stageData.is_current) {
        await supabase
          .from('treatment_stages')
          .update({ is_current: false })
          .eq('plan_id', data.plan_id)
          .neq('id', id);
      }

      return data as TreatmentStage;
    },
    []
  );

  const createStage = useCallback(
    async (
      stageData: Omit<TreatmentStage, 'id' | 'created_at' | 'updated_at'>
    ) => {
      if (demoMode()) {
        const newStage: TreatmentStage = {
          ...stageData,
          id: 'demo-stg-' + rand(10000, 99999),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        for (const plan of DEMO_PLANS) {
          if (plan.id === stageData.plan_id) {
            plan.stages.push(newStage);
            return newStage;
          }
        }
        return newStage;
      }
      const { data, error } = await supabase
        .from('treatment_stages')
        .insert(stageData)
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentStage;
    },
    []
  );

  const deleteStage = useCallback(async (id: string) => {
    if (demoMode()) {
      for (const plan of DEMO_PLANS) {
        const idx = plan.stages.findIndex((s) => s.id === id);
        if (idx >= 0) plan.stages.splice(idx, 1);
      }
      return { error: null };
    }
    const { error } = await supabase.from('treatment_stages').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const setCurrentStage = useCallback(
    async (planId: string, stageId: string) => {
      if (demoMode()) {
        for (const plan of DEMO_PLANS) {
          if (plan.id === planId) {
            plan.stages.forEach((s) => {
              if (s.id === stageId) { s.is_current = true; s.status = 'in_progress'; }
              else s.is_current = false;
            });
            return plan.stages.find((s) => s.id === stageId) as TreatmentStage;
          }
        }
        throw new Error('المرحلة غير موجودة');
      }
      const { error: resetError } = await supabase
        .from('treatment_stages')
        .update({ is_current: false })
        .eq('plan_id', planId);

      if (resetError) throw resetError;

      const { data, error } = await supabase
        .from('treatment_stages')
        .update({ is_current: true, status: 'in_progress' })
        .eq('id', stageId)
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentStage;
    },
    []
  );

  return {
    updateStage,
    createStage,
    deleteStage,
    setCurrentStage,
  };
}

export function usePayments() {
  const createPayment = useCallback(
    async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
      if (demoMode()) {
        const p: Payment = {
          ...paymentData,
          id: 'demo-pay-' + rand(1000, 9999),
          created_at: new Date().toISOString(),
        };
        DEMO_PAYMENTS.push(p);
        return p;
      }
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    []
  );

  const updatePayment = useCallback(
    async (id: string, paymentData: Partial<Payment>) => {
      if (demoMode()) {
        const idx = DEMO_PAYMENTS.findIndex((p) => p.id === id);
        if (idx >= 0) {
          DEMO_PAYMENTS[idx] = { ...DEMO_PAYMENTS[idx], ...paymentData } as Payment;
          return DEMO_PAYMENTS[idx] as Payment;
        }
        throw new Error('الدفعة غير موجودة');
      }
      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    []
  );

  const deletePayment = useCallback(async (id: string) => {
    if (demoMode()) {
      const idx = DEMO_PAYMENTS.findIndex((p) => p.id === id);
      if (idx >= 0) DEMO_PAYMENTS.splice(idx, 1);
      return { error: null };
    }
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    createPayment,
    updatePayment,
    deletePayment,
  };
}

export function useAppointments() {
  const getAllAppointments = useCallback(async () => {
    if (demoMode()) {
      return [...DEMO_APPOINTMENTS].sort((a, b) =>
        a.appointment_date === b.appointment_date
          ? a.appointment_time.localeCompare(b.appointment_time)
          : a.appointment_date.localeCompare(b.appointment_date)
      ) as (Appointment & { patients: { full_name: string; phone: string } })[];
    }
    const online = await checkOnline();
    if (!online) {
      return (await getAdminDataOffline()).appointments;
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients (full_name, phone)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data as (Appointment & { patients: { full_name: string; phone: string } })[];
  }, []);

  const getAppointmentsForDate = useCallback(async (date: string) => {
    if (demoMode()) {
      return DEMO_APPOINTMENTS.filter((a) => a.appointment_date === date) as (Appointment & { patients: { full_name: string; phone: string } })[];
    }
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients (full_name, phone)')
      .eq('appointment_date', date)
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data as (Appointment & { patients: { full_name: string; phone: string } })[];
  }, []);

  const createAppointment = useCallback(
    async (
      appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
    ) => {
      if (demoMode()) {
        const a: Appointment & { patients: { full_name: string; phone: string } } = {
          ...appointmentData,
          id: 'demo-apt-' + rand(1000, 9999),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          patients: {
            full_name: DEMO_PATIENTS.find((p) => p.id === appointmentData.patient_id)?.full_name || 'مريض',
            phone: DEMO_PATIENTS.find((p) => p.id === appointmentData.patient_id)?.phone || '',
          },
        };
        DEMO_APPOINTMENTS.push(a);
        return a as Appointment;
      }
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    []
  );

  const updateAppointment = useCallback(
    async (id: string, appointmentData: Partial<Appointment>) => {
      if (demoMode()) {
        const idx = DEMO_APPOINTMENTS.findIndex((a) => a.id === id);
        if (idx >= 0) {
          const existing = DEMO_APPOINTMENTS[idx];
          DEMO_APPOINTMENTS[idx] = { ...existing, ...appointmentData, updated_at: new Date().toISOString() } as typeof DEMO_APPOINTMENTS[number];
          const { patients, ...rest } = DEMO_APPOINTMENTS[idx];
          void patients;
          return rest as Appointment;
        }
        throw new Error('الموعد غير موجود');
      }
      const { data, error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    []
  );

  const deleteAppointment = useCallback(async (id: string) => {
    if (demoMode()) {
      const idx = DEMO_APPOINTMENTS.findIndex((a) => a.id === id);
      if (idx >= 0) DEMO_APPOINTMENTS.splice(idx, 1);
      return { error: null };
    }
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const getDashboardStats = useCallback(async () => {
    if (demoMode()) {
      const today = todayISO();
      const paidPayments = DEMO_PAYMENTS.filter((p) => p.status === 'paid');
      const thisMonthPaid = paidPayments.filter((p) => {
        const d = new Date(p.payment_date);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      const monthlyRevenue = thisMonthPaid.reduce((s, p) => s + (p.amount || 0), 0);
      return {
        totalPatients: DEMO_PATIENTS.length,
        todayAppointments: DEMO_APPOINTMENTS.filter((a) => a.appointment_date === today).length,
        upcomingAppointments: DEMO_APPOINTMENTS.filter((a) => a.appointment_date >= today).length,
        monthlyRevenue,
      };
    }
    const online = await checkOnline();
    if (!online) {
      const { patients, appointments } = await getAdminDataOffline();
      const today = new Date().toISOString().split('T')[0];
      return {
        totalPatients: patients.length,
        todayAppointments: appointments.filter((a) => a.appointment_date === today).length,
        upcomingAppointments: appointments.filter((a) => a.appointment_date >= today).length,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const [patientsCount, todayAppsRes, upcomingAppsRes, monthlyPaymentsRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', today).lte('appointment_date', nextWeek),
      supabase.from('payments').select('amount').gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    ]);

    const monthlyPayments = (monthlyPaymentsRes.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return {
      totalPatients: patientsCount.count || 0,
      todayAppointments: todayAppsRes.count || 0,
      upcomingAppointments: upcomingAppsRes.count || 0,
      monthlyRevenue: monthlyPayments,
    };
  }, []);

  const refreshAdminCache = useCallback(async () => {
    if (demoMode()) return true;
    const online = await checkOnline();
    if (!online) return false;

    const [patientsRes, appointmentsRes] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('appointments').select('*'),
    ]);

    if (patientsRes.data && appointmentsRes.data) {
      await saveAllAdminDataOffline({
        patients: patientsRes.data as Patient[],
        appointments: appointmentsRes.data as Appointment[],
      });
      return true;
    }
    return false;
  }, []);

  return {
    getAllAppointments,
    getAppointmentsForDate,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getDashboardStats,
    refreshAdminCache,
  };
}
