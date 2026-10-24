import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getApiUser } from '@/lib/api-auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const currentUser = await getApiUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { token, user_id, patient_id, device_type } = body;

    if (!token || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // لا يمكن لمستخدم تسجيل توكن لغيره
    if (user_id !== currentUser.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403, headers: corsHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createAdminClient(supabaseUrl, serviceKey);

    const { data, error } = (await supabase
      .from('fcm_tokens')
      .upsert(
        {
          user_id,
          patient_id: patient_id || null,
          token,
          device_type: device_type || 'android',
        } as any,
        { onConflict: 'token' }
      )
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, data }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
