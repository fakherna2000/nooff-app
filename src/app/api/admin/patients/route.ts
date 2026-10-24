import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    // إضافة مريض — للأدمن فقط
    const currentUser = await getApiUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const {
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      address,
      medical_history,
      notes,
      treatment_type,
      diagnosis,
      password,
    } = body;

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let userId: string | null = null;

    if (email && password) {
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, role: 'patient' },
        });

      if (authError) {
        return NextResponse.json(
          { error: authError.message || 'فشل إنشاء حساب المريض' },
          { status: 400 }
        );
      }
      userId = authData.user.id;
    }

    const patientData: any = {
      full_name,
      phone,
      email: email || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      address: address || null,
      medical_history: medical_history || null,
      notes: notes || null,
      treatment_type: treatment_type || 'general',
      diagnosis: diagnosis || null,
      user_id: userId,
    };

    const { data: patient, error: insertError } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();

    if (insertError) {
      if (userId) {
        await supabase.auth.admin.deleteUser(userId);
      }
      return NextResponse.json(
        { error: insertError.message || 'فشل إضافة المريض' },
        { status: 400 }
      );
    }

    return NextResponse.json(patient);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
