import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, user_id, patient_id, user_agent } = body;

    if (!subscription?.endpoint || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

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
        { onConflict: 'endpoint' }
      )
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
