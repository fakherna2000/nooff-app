export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface MobileAppImages {
  app_background_image_url?: string | null;
  login_background_image_url?: string | null;
  home_hero_image_url?: string | null;
  appointments_banner_image_url?: string | null;
  posts_banner_image_url?: string | null;
  treatment_banner_image_url?: string | null;
  profile_background_image_url?: string | null;
  home_service_dental_image_url?: string | null;
  home_service_beauty_image_url?: string | null;
  home_feature_whitening_image_url?: string | null;
  home_feature_skincare_image_url?: string | null;
  home_feature_implants_image_url?: string | null;
  treatment_feature_cleaning_image_url?: string | null;
  treatment_feature_aligners_image_url?: string | null;
  treatment_feature_veneers_image_url?: string | null;
  posts_fallback_image_url?: string | null;
}

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
          treatment_type: 'orthodontics' | 'general';
          diagnosis: string | null;
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
          treatment_type?: 'orthodontics' | 'general';
          diagnosis?: string | null;
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
          treatment_type?: 'orthodontics' | 'general';
          diagnosis?: string | null;
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
          currency_id?: string | null;
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
          currency_id?: string | null;
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
          currency_id?: string | null;
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
          status: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show' | 'requested';
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
          status?: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show' | 'requested';
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
          status?: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show' | 'requested';
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
      posts: {
        Row: {
          id: string;
          title: string;
          body: string | null;
          image_url: string | null;
          type: 'offer' | 'ad' | 'tip' | 'general';
          is_published: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string | null;
          image_url?: string | null;
          type?: 'offer' | 'ad' | 'tip' | 'general';
          is_published?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string | null;
          image_url?: string | null;
          type?: 'offer' | 'ad' | 'tip' | 'general';
          is_published?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      currencies: {
        Row: {
          id: string;
          code: string;
          name: string;
          symbol: string;
          exchange_rate: number;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          symbol: string;
          exchange_rate?: number;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          symbol?: string;
          exchange_rate?: number;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      clinic_settings: {
        Row: {
          id: string;
          clinic_name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          currency_id: string | null;
          mobile_images: MobileAppImages | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          currency_id?: string | null;
          mobile_images?: MobileAppImages | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          currency_id?: string | null;
          mobile_images?: MobileAppImages | null;
          updated_at?: string;
        };
      };
      clinic_services: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: 'dental' | 'beauty';
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: 'dental' | 'beauty';
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: 'dental' | 'beauty';
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      clinic_doctors: {
        Row: {
          id: string;
          name: string;
          specialty: string | null;
          bio: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialty?: string | null;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialty?: string | null;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      loyalty_rewards: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          points_cost: number;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          points_cost: number;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          points_cost?: number;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      loyalty_wallets: {
        Row: {
          id: string;
          patient_id: string;
          points_balance: number;
          lifetime_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          points_balance?: number;
          lifetime_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          points_balance?: number;
          lifetime_points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      loyalty_transactions: {
        Row: {
          id: string;
          patient_id: string;
          points: number;
          type: string;
          reason: string | null;
          appointment_id: string | null;
          reward_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          points: number;
          type: string;
          reason?: string | null;
          appointment_id?: string | null;
          reward_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          points?: number;
          type?: string;
          reason?: string | null;
          appointment_id?: string | null;
          reward_id?: string | null;
          created_at?: string;
        };
      };
      loyalty_redemptions: {
        Row: {
          id: string;
          patient_id: string;
          reward_id: string | null;
          reward_title: string | null;
          points_spent: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          reward_id?: string | null;
          reward_title?: string | null;
          points_spent: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          reward_id?: string | null;
          reward_title?: string | null;
          points_spent?: number;
          status?: string;
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
export type Post = Database['public']['Tables']['posts']['Row'];
export type Currency = Database['public']['Tables']['currencies']['Row'];
export type ClinicSettings = Database['public']['Tables']['clinic_settings']['Row'];
export type ClinicService = Database['public']['Tables']['clinic_services']['Row'];
export type ClinicDoctor = Database['public']['Tables']['clinic_doctors']['Row'];
export type LoyaltyReward = Database['public']['Tables']['loyalty_rewards']['Row'];
export type LoyaltyWallet = Database['public']['Tables']['loyalty_wallets']['Row'];
export type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
export type LoyaltyRedemption = Database['public']['Tables']['loyalty_redemptions']['Row'];

export type PatientWithDetails = Patient & {
  treatment_plans: (TreatmentPlan & {
    stages: TreatmentStage[];
  })[];
  payments: Payment[];
  appointments: Appointment[];
};
