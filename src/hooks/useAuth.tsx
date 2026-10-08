'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AuthRole = 'admin' | 'patient' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AuthRole;
  loading: boolean;
  isAdmin: boolean;
  supabaseReady: boolean;
  demoMode: boolean;
  currentPatientId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN_USER: User = {
  id: 'demo-admin-uuid',
  app_metadata: { role: 'admin' },
  user_metadata: { role: 'admin', full_name: 'مدير النظام' },
  aud: 'authenticated',
  email: 'admin@noof.com',
  phone: '',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
};

const DEMO_PATIENT_USER: User = {
  id: 'demo-patient-uuid',
  app_metadata: { role: 'patient' },
  user_metadata: { role: 'patient', full_name: 'سارة أحمد', patient_id: 'demo-patient-1' },
  aud: 'authenticated',
  email: 'patient@noof.com',
  phone: '+971501234567',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
};

const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 9999999,
  token_type: 'bearer',
  user: DEMO_ADMIN_USER,
} as any;

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const supabaseReady = isSupabaseConfigured();
  const demoMode = !supabaseReady;

  const isAdminRoute = pathname.startsWith('/admin');
  const isPatientRoute = pathname.startsWith('/patient');

  const getUserRole = useCallback((u: User | null): AuthRole => {
    if (!u) return null;
    const appRole = u.app_metadata?.role;
    const userRole = u.user_metadata?.role;
    if (appRole === 'admin' || userRole === 'admin') return 'admin';
    return 'patient';
  }, []);

  const currentPatientId =
    role === 'patient' ? (user?.user_metadata?.patient_id as string) || 'demo-patient-1' : null;

  useEffect(() => {
    let mounted = true;
    let subscriptionUnsub: (() => void) | null = null;

    async function getInitialSession() {
      if (!supabaseReady) {
        if (!mounted) return;
        if (isPatientRoute) {
          const user = { ...DEMO_PATIENT_USER };
          setSession({ ...DEMO_SESSION, user });
          setUser(user);
          setRole('patient');
        } else {
          const user = { ...DEMO_ADMIN_USER };
          setSession({ ...DEMO_SESSION, user });
          setUser(user);
          setRole('admin');
        }
        setLoading(false);
        return;
      }
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user || null);
        setRole(getUserRole(initialSession?.user || null));
      } catch (e) {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    if (supabaseReady) {
      try {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (!mounted) return;
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setRole(getUserRole(currentSession?.user || null));
          setLoading(false);
        });
        subscriptionUnsub = () => subscription.unsubscribe();
      } catch (e) {
        // no-op
      }
    }

    return () => {
      mounted = false;
      if (subscriptionUnsub) subscriptionUnsub();
    };
  }, [supabase, getUserRole, supabaseReady, isPatientRoute]);

  const signIn = async (email: string, password: string) => {
    if (!supabaseReady) {
      return { error: { message: 'supabase-not-configured' } };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    if (!supabaseReady) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // no-op
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        isAdmin: role === 'admin',
        supabaseReady,
        demoMode,
        currentPatientId,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
