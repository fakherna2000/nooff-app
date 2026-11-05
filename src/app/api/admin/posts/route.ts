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

const POST_TYPES = ['offer', 'ad', 'tip', 'general'];

export async function GET() {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('posts')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

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
  if (!title) {
    return NextResponse.json({ error: 'عنوان المنشور مطلوب' }, { status: 400 });
  }

  const type = POST_TYPES.includes(body.type) ? body.type : 'general';
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('posts')
    .insert({
      title,
      body: body.body || null,
      image_url: body.image_url || null,
      type,
      is_published: body.is_published !== false,
      order_index: Number.isFinite(Number(body.order_index)) ? Math.trunc(Number(body.order_index)) : 0,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
