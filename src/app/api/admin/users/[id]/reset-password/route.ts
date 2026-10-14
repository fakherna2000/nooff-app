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

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const { password } = body;

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(params.id, {
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || 'فشل إعادة تعيين كلمة المرور' },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
