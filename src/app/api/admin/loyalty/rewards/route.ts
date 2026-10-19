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

// جلب كل المكافآت (المفعّلة وغير المفعّلة) للإدارة
export async function GET() {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('loyalty_rewards')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// إضافة مكافأة جديدة
export async function POST(request: Request) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const title = (body.title || '').trim();
  const pointsCost = Number(body.points_cost);

  if (!title) {
    return NextResponse.json({ error: 'عنوان المكافأة مطلوب' }, { status: 400 });
  }
  if (!Number.isFinite(pointsCost) || pointsCost <= 0) {
    return NextResponse.json({ error: 'تكلفة النقاط يجب أن تكون أكبر من صفر' }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('loyalty_rewards')
    .insert({
      title,
      description: body.description || null,
      points_cost: Math.trunc(pointsCost),
      image_url: body.image_url || null,
      is_active: body.is_active !== false,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Math.trunc(Number(body.sort_order)) : 0,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
