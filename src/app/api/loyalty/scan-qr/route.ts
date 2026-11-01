import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/api-auth';
import {
  CLINIC_QR_TOKEN,
  CLINIC_QR_POINTS,
  CLINIC_QR_REASON,
  CLINIC_QR_COOLDOWN_HOURS,
} from '@/lib/loyalty-qr';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function formatRemainingWait(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} ساعة و${minutes} دقيقة`;
  if (hours > 0) return `${hours} ساعة`;
  return `${minutes} دقيقة`;
}

// قراءة QR العيادة من تطبيق المريض → إضافة نقاط للمحفظة
export async function POST(request: Request) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || '').trim();

    if (!code || code !== CLINIC_QR_TOKEN) {
      return NextResponse.json({ error: 'هذا الرمز غير صحيح' }, { status: 400, headers: corsHeaders });
    }

    const admin = createAdminClient() as any;

    // المريض يُشتق من الجلسة — لا يمكن إضافة نقاط لحساب آخر
    const { data: patient, error: patientError } = await admin
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500, headers: corsHeaders });
    }
    if (!patient) {
      return NextResponse.json(
        { error: 'لا يوجد ملف مريض مرتبط بحسابك' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { data: latestScan, error: latestScanError } = await admin
      .from('loyalty_transactions')
      .select('created_at')
      .eq('patient_id', patient.id)
      .eq('type', 'earn')
      .eq('reason', CLINIC_QR_REASON)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestScanError) {
      return NextResponse.json({ error: latestScanError.message }, { status: 500, headers: corsHeaders });
    }

    if (latestScan?.created_at) {
      const lastScanAt = new Date(latestScan.created_at).getTime();
      const nextAllowedAt = lastScanAt + CLINIC_QR_COOLDOWN_HOURS * 60 * 60 * 1000;
      const remainingMs = nextAllowedAt - Date.now();

      if (remainingMs > 0) {
        return NextResponse.json(
          {
            error: `يمكن قراءة باركود العيادة مرة واحدة كل ${CLINIC_QR_COOLDOWN_HOURS} ساعة. حاول بعد ${formatRemainingWait(remainingMs)}.`,
            next_allowed_at: new Date(nextAllowedAt).toISOString(),
          },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    const { data, error } = await admin.rpc('loyalty_adjust_points', {
      p_patient_id: patient.id,
      p_points: CLINIC_QR_POINTS,
      p_type: 'earn',
      p_reason: CLINIC_QR_REASON,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      data: { points_balance: data, added: CLINIC_QR_POINTS },
    }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
