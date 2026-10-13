import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const body = await request.json();
    const { token, user_id, patient_id, device_type } = body;

    if (!token || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient();

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
