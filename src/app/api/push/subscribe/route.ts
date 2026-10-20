import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// تسجيل اشتراك Web Push (للآيفون والمتصفح) — يستخدم service_role لتجاوز RLS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, user_id, patient_id, user_agent } = body;

    if (!subscription?.endpoint || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createAdminClient(supabaseUrl, serviceKey);
    const keys = subscription.keys || {};

    const { data, error } = (await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id,
          patient_id: patient_id || null,
          endpoint: subscription.endpoint,
          keys_p256dh: keys.p256dh || '',
          keys_auth: keys.auth || '',
          user_agent: user_agent || null,
        } as any,
        { onConflict: 'endpoint' },
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
