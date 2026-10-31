import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/api-auth';
import { CLINIC_QR_TOKEN, CLINIC_QR_POINTS } from '@/lib/loyalty-qr';

// قراءة QR العيادة من تطبيق المريض → إضافة نقاط للمحفظة
export async function POST(request: Request) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || '').trim();

    if (!code || code !== CLINIC_QR_TOKEN) {
      return NextResponse.json({ error: 'هذا الرمز غير صحيح' }, { status: 400 });
    }

    const admin = createAdminClient() as any;

    // المريض يُشتق من الجلسة — لا يمكن إضافة نقاط لحساب آخر
    const { data: patient, error: patientError } = await admin
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 });
    }
    if (!patient) {
      return NextResponse.json({ error: 'لا يوجد ملف مريض مرتبط بحسابك' }, { status: 404 });
    }

    const { data, error } = await admin.rpc('loyalty_adjust_points', {
      p_patient_id: patient.id,
      p_points: CLINIC_QR_POINTS,
      p_type: 'earn',
      p_reason: 'قراءة QR العيادة',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { points_balance: data, added: CLINIC_QR_POINTS },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
