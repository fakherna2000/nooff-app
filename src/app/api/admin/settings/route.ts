import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const role = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('clinic_settings')
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const role = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const body = await request.json();

  const admin = createAdminClient() as any;

  // تحديث العملة الافتراضية في جدول currencies
  if (body.currency_id) {
    await admin.from('currencies').update({ is_default: false });
    await admin.from('currencies').update({ is_default: true }).eq('id', body.currency_id);
  }

  const { data, error } = await admin
    .from('clinic_settings')
    .update({
      clinic_name: body.clinic_name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      logo_url: body.logo_url,
      currency_id: body.currency_id,
      mobile_images: body.mobile_images || {},
      updated_at: new Date().toISOString(),
    })
    .not('id', 'is', null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
