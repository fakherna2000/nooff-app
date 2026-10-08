import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, full_name, user_id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string; full_name: string; user_id: string } | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    patientId: patient?.id || null,
    patientName: patient?.full_name || null,
  });
}
