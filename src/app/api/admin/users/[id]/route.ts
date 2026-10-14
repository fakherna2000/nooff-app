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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const { email, full_name, role } = body;
  const admin = createAdminClient() as any;

  const currentUserId = (await createClient().auth.getUser()).data.user?.id;
  if (currentUserId === params.id && role && role !== 'admin') {
    return NextResponse.json(
      { error: 'لا يمكنك تغيير دورك الخاص إلى غير أدمن' },
      { status: 400 },
    );
  }

  const updateData: any = {};
  if (email) updateData.email = email;
  if (full_name !== undefined) {
    updateData.user_metadata = { full_name, role: role || undefined };
  }
  if (role) {
    updateData.app_metadata = { role };
  }

  const { data: userData, error: updateError } = await admin.auth.admin.updateUserById(
    params.id,
    updateData,
  );

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || 'فشل تحديث المستخدم' },
      { status: 400 },
    );
  }

  if (role === 'patient') {
    const { data: existingPatient } = await admin
      .from('patients')
      .select('id')
      .eq('user_id', params.id)
      .single();

    if (!existingPatient) {
      await admin.from('patients').insert({
        full_name:
          full_name ||
          (userData.user.user_metadata?.full_name as string) ||
          email?.split('@')[0] ||
          'مريض',
        email: email || userData.user.email,
        phone: body.phone || null,
        user_id: params.id,
        treatment_type: 'general',
      });
    }
  }

  if (role === 'admin') {
    await admin.from('patients').update({ user_id: null }).eq('user_id', params.id);
  }

  return NextResponse.json({ data: { id: userData.user.id, email: userData.user.email } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;

  const currentUserId = (await createClient().auth.getUser()).data.user?.id;
  if (currentUserId === params.id) {
    return NextResponse.json(
      { error: 'لا يمكنك حذف حسابك الخاص' },
      { status: 400 },
    );
  }

  await admin.from('patients').update({ user_id: null }).eq('user_id', params.id);

  const { error } = await admin.auth.admin.deleteUser(params.id);
  if (error) {
    return NextResponse.json(
      { error: error.message || 'فشل حذف المستخدم' },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
