import { SupabaseClient } from '@supabase/supabase-js';
import Dexie, { Table } from 'dexie';
import type { Patient, TreatmentPlan, TreatmentStage, Payment, Appointment } from './database.types';

export class ClinicDB extends Dexie {
  patients!: Table<Patient, string>;
  treatmentPlans!: Table<TreatmentPlan, string>;
  treatmentStages!: Table<TreatmentStage, string>;
  payments!: Table<Payment, string>;
  appointments!: Table<Appointment, string>;
  metadata!: Table<{ key: string; value: any; updated_at: string }, string>;

  constructor() {
    super('NoofClinicDB');
    this.version(1).stores({
      patients: 'id, full_name, phone, user_id, updated_at',
      treatmentPlans: 'id, patient_id, updated_at',
      treatmentStages: 'id, plan_id, order_index, updated_at',
      payments: 'id, patient_id, plan_id, payment_date, created_at',
      appointments: 'id, patient_id, appointment_date, status, updated_at',
      metadata: 'key',
    });
  }
}

export const localDB = new ClinicDB();

export async function isOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

export function onOnlineStatusChange(handler: (online: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => handler(true);
  const handleOffline = () => handler(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export async function savePatientDataOffline(patient: PatientWithAllRelations) {
  await localDB.transaction('rw', localDB.patients, localDB.treatmentPlans, localDB.treatmentStages, localDB.payments, localDB.appointments, async () => {
    await localDB.patients.put(patient);
    await localDB.treatmentPlans.bulkPut(patient.treatment_plans);
    const allStages = patient.treatment_plans.flatMap(p => p.stages);
    await localDB.treatmentStages.bulkPut(allStages);
    await localDB.payments.bulkPut(patient.payments);
    await localDB.appointments.bulkPut(patient.appointments);
    await localDB.metadata.put({
      key: `patient_${patient.id}_last_sync`,
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
}

export async function getPatientDataOffline(patientId: string): Promise<PatientWithAllRelations | null> {
  const patient = await localDB.patients.get(patientId);
  if (!patient) return null;

  const plans = await localDB.treatmentPlans.where('patient_id').equals(patientId).toArray();
  const planIds = plans.map(p => p.id);
  const stages = planIds.length > 0 ? await localDB.treatmentStages.where('plan_id').anyOf(planIds).toArray() : [];
  const payments = await localDB.payments.where('patient_id').equals(patientId).toArray();
  const appointments = await localDB.appointments.where('patient_id').equals(patientId).toArray();

  const plansWithStages = plans.map(plan => ({
    ...plan,
    stages: stages.filter(s => s.plan_id === plan.id).sort((a, b) => a.order_index - b.order_index),
  }));

  return {
    ...patient,
    treatment_plans: plansWithStages,
    payments: payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    appointments: appointments.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()),
  };
}

export type PatientWithAllRelations = Patient & {
  treatment_plans: (TreatmentPlan & { stages: TreatmentStage[] })[];
  payments: Payment[];
  appointments: Appointment[];
};

export async function syncPatientDataWithServer(
  supabase: SupabaseClient,
  patientId: string
): Promise<PatientWithAllRelations | null> {
  try {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) return null;

    const { data: plans } = await supabase
      .from('treatment_plans')
      .select('*, stages:treatment_stages(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    const patientData: PatientWithAllRelations = {
      ...patient,
      treatment_plans: (plans || []).map(p => ({
        ...p,
        stages: (p as any).stages.sort((a: TreatmentStage, b: TreatmentStage) => a.order_index - b.order_index),
      })),
      payments: payments || [],
      appointments: appointments || [],
    };

    await savePatientDataOffline(patientData);
    return patientData;
  } catch (error) {
    console.error('Sync error:', error);
    return null;
  }
}

export async function saveAllAdminDataOffline(data: {
  patients: Patient[];
  appointments: Appointment[];
}) {
  await localDB.transaction('rw', localDB.patients, localDB.appointments, localDB.metadata, async () => {
    await localDB.patients.bulkPut(data.patients);
    await localDB.appointments.bulkPut(data.appointments);
    await localDB.metadata.put({
      key: 'admin_last_sync',
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
}

export async function getAdminDataOffline() {
  const patients = await localDB.patients.toArray();
  const appointments = await localDB.appointments.toArray();
  return { patients, appointments };
}
