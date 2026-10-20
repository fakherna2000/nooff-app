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

const CATEGORIES = ['dental', 'beauty'];

// جلب كل الخدمات (المفعّلة وغير المفعّلة) للإدارة
export async function GET() {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('clinic_services')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// إضافة خدمة جديدة
export async function POST(request: Request) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const title = (body.title || '').trim();
  const category = CATEGORIES.includes(body.category) ? body.category : 'dental';

  if (!title) {
    return NextResponse.json({ error: 'اسم الخدمة مطلوب' }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('clinic_services')
    .insert({
      title,
      description: body.description || null,
      category,
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
