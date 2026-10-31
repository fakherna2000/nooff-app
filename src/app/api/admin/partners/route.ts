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

const CATEGORIES = ['restaurant', 'pharmacy', 'lab', 'store', 'other'];

export async function GET() {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('partner_ads')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const title = String(body.title || '').trim();
  const category = CATEGORIES.includes(body.category) ? body.category : 'other';

  if (!title) {
    return NextResponse.json({ error: 'اسم الإعلان مطلوب' }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('partner_ads')
    .insert({
      title,
      description: body.description || null,
      category,
      image_url: body.image_url || null,
      cta_label: body.cta_label || null,
      target_url: body.target_url || null,
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
