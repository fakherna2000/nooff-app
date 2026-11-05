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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'عنوان المنشور مطلوب' }, { status: 400 });
    }
    updates.title = title;
  }
  if (body.body !== undefined) updates.body = body.body || null;
  if (body.image_url !== undefined) updates.image_url = body.image_url || null;
  if (body.is_published !== undefined) updates.is_published = !!body.is_published;
  if (body.order_index !== undefined) {
    updates.order_index = Number.isFinite(Number(body.order_index)) ? Math.trunc(Number(body.order_index)) : 0;
  }
  if (body.type !== undefined) {
    if (!POST_TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'نوع المنشور غير صحيح' }, { status: 400 });
    }
    updates.type = body.type;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'لا يوجد تغييرات' }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('posts')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { error } = await admin.from('posts').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
