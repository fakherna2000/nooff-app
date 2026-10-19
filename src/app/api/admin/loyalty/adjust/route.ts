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

// تعديل رصيد نقاط مريض يدوياً من لوحة الإدارة
export async function POST(request: Request) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const { patient_id, points, reason } = body;

  const numericPoints = Number(points);
  if (!patient_id || !Number.isFinite(numericPoints) || numericPoints === 0) {
    return NextResponse.json({ error: 'قيمة النقاط غير صحيحة' }, { status: 400 });
  }

  const admin = createAdminClient() as any;

  const { data, error } = await admin.rpc('loyalty_adjust_points', {
    p_patient_id: patient_id,
    p_points: Math.trunc(numericPoints),
    p_type: 'adjust',
    p_reason: reason || 'تعديل إداري',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { points_balance: data } });
}
