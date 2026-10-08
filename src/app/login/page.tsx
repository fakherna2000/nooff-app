'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { Tooth } from '@/components/icons/Tooth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') as 'admin' | 'patient' | null;
  const [mode, setMode] = useState<'admin' | 'patient'>(modeParam === 'patient' ? 'patient' : 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, role, loading } = useAuth();
  const router = useRouter();
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (loading) return;
    if (role === 'admin') router.replace('/admin');
    if (role === 'patient') router.replace('/patient');
  }, [role, loading, router]);

  const formatErrorMessage = (err: any): string => {
    const msg = (err?.message || '').toString();
    if (!supabaseReady) {
      return 'لم يتم إعداد Supabase بعد — برجاء تعبئة NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local';
    }
    if (/failed to fetch|networkerror|fetch failed|enotfound|econnrefused|getaddrinfo/i.test(msg)) {
      return 'تعذر الاتصال بالخادم — تحقق من اتصال الإنترنت وصحة إعدادات Supabase';
    }
    if (/invalid login credentials|invalid.*password|invalid.*email/i.test(msg)) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    }
    if (/email not confirmed/i.test(msg)) {
      return 'برجاء تأكيد البريد الإلكتروني أولاً';
    }
    return msg || 'فشل تسجيل الدخول';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (!supabaseReady) {
      toast.error(formatErrorMessage({ message: 'supabase-not-configured' }), {
        description: 'وضع العرض فقط — إعداد Supabase يتيح تسجيل الدخول الفعلي',
        duration: 8000,
      });
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(formatErrorMessage(error));
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            العودة للصفحة الرئيسية
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <Tooth className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-2xl">مركز نوف</h1>
              <p className="text-sm text-gray-500">نظام إدارة طب الأسنان</p>
            </div>
          </div>
          {!supabaseReady && (
            <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              ⚠ وضع المعاينة: Supabase غير مهيأ بعد. سجل الدخول الفعلي سيعمل تلقائياً بعد تعبئة متغيرات البيئة في ملف{' '}
              <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">.env.local</span>
            </div>
          )}
        </div>

        <div className="card shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
          <p className="text-gray-600 text-sm mb-6">
            {mode === 'admin' ? 'تسجيل دخول لوحة إدارة المركز' : 'تسجيل دخول حساب المريض'}
          </p>

          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'admin' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              الإدارة
            </button>
            <button
              type="button"
              onClick={() => setMode('patient')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'patient' ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              المريض
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                dir="ltr"
                className="input text-right"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'admin' ? 'admin@clinic.com' : 'patient@email.com'}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="btn-primary w-full py-3 text-base shadow-lg"
            >
              {submitting ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              {mode === 'admin' ? (
                'للتجربة: admin@noof.com / admin123'
              ) : (
                'للتجربة: patient@noof.com / patient123'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
