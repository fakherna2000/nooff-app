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

export async function GET() {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const admin = createAdminClient() as any;

  const {
    data: { users },
    error: listError,
  } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const { data: patients } = await admin.from('patients').select('id, full_name, phone, user_id');

  const usersWithPatients = users.map((u: any) => {
    const patient = patients?.find((p: any) => p.user_id === u.id);
    return {
      id: u.id,
      email: u.email,
      full_name:
        (u.user_metadata?.full_name as string) ||
        patient?.full_name ||
        u.email?.split('@')[0] ||
        'مستخدم',
      phone: patient?.phone || null,
      role: (u.app_metadata?.role as string) || (u.user_metadata?.role as string) || 'patient',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: u.banned_until,
      is_patient: !!patient,
      patient_id: patient?.id || null,
    };
  });

  usersWithPatients.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return NextResponse.json({ data: usersWithPatients });
}

export async function POST(request: Request) {
  const notAllowed = await checkAdmin();
  if (notAllowed) return notAllowed;

  const body = await request.json();
  const { email, password, full_name, role } = body;

  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'الاسم والبريد وكلمة المرور مطلوبة' },
      { status: 400 },
    );
  }

  const userRole = role === 'admin' ? 'admin' : 'patient';
  const admin = createAdminClient() as any;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: userRole },
  });

  if (authError) {
    return NextResponse.json(
      { error: authError.message || 'فشل إنشاء المستخدم' },
      { status: 400 },
    );
  }

  await admin.auth.admin.updateUserById(authData.user.id, {
    app_metadata: { role: userRole },
  });

  let patientId: string | null = null;
  if (userRole === 'patient') {
    const { data: patient, error: patientError } = await admin
      .from('patients')
      .insert({
        full_name,
        email,
        phone: body.phone || null,
        user_id: authData.user.id,
        treatment_type: 'general',
      })
      .select('id')
      .single();

    if (patientError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: patientError.message || 'فشل إنشاء سجل المريض' },
        { status: 400 },
      );
    }
    patientId = patient?.id || null;
  }

  return NextResponse.json({
    data: {
      id: authData.user.id,
      email,
      full_name,
      role: userRole,
      created_at: authData.user.created_at,
      patient_id: patientId,
    },
  });
}
