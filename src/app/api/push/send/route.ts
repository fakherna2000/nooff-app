import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, title, body: messageBody, data } = body;

    if (!patient_id || !title || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@clinic.com';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPrivateKey || !vapidPublicKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured. Push notifications disabled.' },
        { status: 501 }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient();

    const { data: subscriptions, error } = (await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('patient_id', patient_id)) as {
      data:
        | {
            id: string;
            endpoint: string;
            keys_p256dh: string;
            keys_auth: string;
          }[]
        | null;
      error: any;
    };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: {
        ...data,
        patient_id,
      },
    });

    const results: any[] = [];
    for (const sub of subscriptions || []) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth,
          },
        };
        const res = await webpush.sendNotification(pushSubscription as any, payload);
        results.push({ status: 'success', id: sub.id, statusCode: res.statusCode });
      } catch (e: any) {
        if (e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        results.push({ status: 'error', id: sub.id, message: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === 'success').length,
      total: results.length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
