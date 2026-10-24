import { createClient } from '@/lib/supabase/server';

export interface ApiUser {
  id: string;
  role: string;
  email: string | null;
}

function toApiUser(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}): ApiUser {
  const role =
    (user.app_metadata?.role as string) ||
    (user.user_metadata?.role as string) ||
    'patient';
  return { id: user.id, role, email: user.email ?? null };
}

/**
 * يتحقق من هوية المتصل عبر طريقتين:
 *  1. هيدر `Authorization: Bearer <access_token>` — تستخدمه بوابة المريض على الجوال.
 *  2. كوكي الجلسة — تستخدمه واجهة الويب.
 * يرجع null إذا لم توجد جلسة صالحة.
 */
export async function getApiUser(request: Request): Promise<ApiUser | null> {
  const supabase = createClient();

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) return toApiUser(data.user);
      return null;
    }
  }

  const { data } = await supabase.auth.getUser();
  return data?.user ? toApiUser(data.user) : null;
}
