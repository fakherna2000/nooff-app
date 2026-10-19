import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const role = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }
  return null;
}

// جلب محفظة مريض معين مع سجل حركاته
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;

  const [walletRes, txRes] = await Promise.all([
    admin.from('loyalty_wallets').select('*').eq('patient_id', params.id).maybeSingle(),
    admin
      .from('loyalty_transactions')
      .select('*')
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (walletRes.error && walletRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: walletRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      points_balance: walletRes.data?.points_balance ?? 0,
      lifetime_points: walletRes.data?.lifetime_points ?? 0,
      transactions: txRes.data || [],
    },
  });
}
