export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          date_of_birth: string | null;
          gender: 'male' | 'female' | null;
          address: string | null;
          medical_history: string | null;
          allergies: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | null;
          address?: string | null;
          medical_history?: string | null;
          allergies?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | null;
          address?: string | null;
          medical_history?: string | null;
          allergies?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      treatment_plans: {
        Row: {
          id: string;
          patient_id: string;
          title: string;
          name?: string;
          description: string | null;
          total_cost: number;
          status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          title: string;
          name?: string;
          description?: string | null;
          total_cost?: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          title?: string;
          name?: string;
          description?: string | null;
          total_cost?: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      treatment_stages: {
        Row: {
          id: string;
          plan_id: string;
          name: string;
          description: string | null;
          status: 'not_started' | 'in_progress' | 'completed';
          is_current: boolean;
          order_index: number;
          cost: number | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          name: string;
          description?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          is_current?: boolean;
          order_index?: number;
          cost?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          name?: string;
          description?: string | null;
          status?: 'not_started' | 'in_progress' | 'completed';
          is_current?: boolean;
          order_index?: number;
          cost?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          patient_id: string;
          plan_id: string | null;
          amount: number;
          payment_method: 'cash' | 'card' | 'bank_transfer' | 'other';
          method?: 'cash' | 'card' | 'bank_transfer' | 'other';
          status: 'paid' | 'pending' | 'refunded' | 'cancelled';
          notes: string | null;
          payment_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          plan_id?: string | null;
          amount: number;
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other';
          method?: 'cash' | 'card' | 'bank_transfer' | 'other';
          status?: 'paid' | 'pending' | 'refunded' | 'cancelled';
          notes?: string | null;
          payment_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          plan_id?: string | null;
          amount?: number;
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other';
          method?: 'cash' | 'card' | 'bank_transfer' | 'other';
          status?: 'paid' | 'pending' | 'refunded' | 'cancelled';
          notes?: string | null;
          payment_date?: string;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          appointment_date: string;
          appointment_time: string;
          duration_minutes: number;
          type: string;
          notes: string | null;
          status: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          appointment_date: string;
          appointment_time: string;
          duration_minutes?: number;
          type?: string;
          notes?: string | null;
          status?: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          appointment_date?: string;
          appointment_time?: string;
          duration_minutes?: number;
          type?: string;
          notes?: string | null;
          status?: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
          created_at?: string;
          updated_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          patient_id: string | null;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_id?: string | null;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Patient = Database['public']['Tables']['patients']['Row'];
export type TreatmentPlan = Database['public']['Tables']['treatment_plans']['Row'];
export type TreatmentStage = Database['public']['Tables']['treatment_stages']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];

export type PatientWithDetails = Patient & {
  treatment_plans: (TreatmentPlan & {
    stages: TreatmentStage[];
  })[];
  payments: Payment[];
  appointments: Appointment[];
};
