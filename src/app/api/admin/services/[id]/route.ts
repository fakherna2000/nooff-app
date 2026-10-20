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

// تعديل خدمة
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: 'اسم الخدمة مطلوب' }, { status: 400 });
    }
    updates.title = title;
  }
  if (body.description !== undefined) updates.description = body.description || null;
  if (body.image_url !== undefined) updates.image_url = body.image_url || null;
  if (body.is_active !== undefined) updates.is_active = !!body.is_active;
  if (body.sort_order !== undefined) updates.sort_order = Math.trunc(Number(body.sort_order)) || 0;
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: 'تصنيف الخدمة غير صحيح' }, { status: 400 });
    }
    updates.category = body.category;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'لا يوجد تغييرات' }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('clinic_services')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// حذف خدمة
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;
  const { error } = await admin.from('clinic_services').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
