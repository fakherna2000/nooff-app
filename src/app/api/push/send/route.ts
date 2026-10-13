import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, title, body: messageBody, data } = body;

    if (!patient_id || !title || !messageBody) {
      return NextResponse.json({ error: 'الرجاء إدخال جميع الحقول المطلوبة' }, { status: 400 });
    }

    const supabase = createClient();
    const results: any[] = [];

    // === Web Push (للمتصفح) ===
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@clinic.com';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (vapidPrivateKey && vapidPublicKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

      const { data: subscriptions, error: subError } = (await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('patient_id', patient_id)) as {
        data: { id: string; endpoint: string; keys_p256dh: string; keys_auth: string }[] | null;
        error: any;
      };

      if (!subError) {
        const payload = JSON.stringify({
          title,
          body: messageBody,
          icon: '/icon.svg',
          badge: '/icon.svg',
          data: { ...data, patient_id },
        });

        for (const sub of subscriptions || []) {
          try {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            };
            const res = await webpush.sendNotification(pushSubscription as any, payload);
            results.push({ channel: 'web-push', status: 'success', id: sub.id, statusCode: res.statusCode });
          } catch (e: any) {
            if (e.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
            results.push({ channel: 'web-push', status: 'error', id: sub.id, message: e.message });
          }
        }
      }
    }

    // === Firebase Cloud Messaging (لتطبيق الأندرويد) ===
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (fcmServerKey) {
      const { data: fcmTokens, error: fcmError } = (await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('patient_id', patient_id)) as {
        data: { id: string; token: string }[] | null;
        error: any;
      };

      if (!fcmError) {
        for (const fcm of fcmTokens || []) {
          try {
            const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${fcmServerKey}`,
              },
              body: JSON.stringify({
                to: fcm.token,
                notification: { title, body: messageBody },
                data: { ...data, patient_id },
              }),
            });
            const fcmData = await fcmRes.json();
            if (fcmRes.ok && fcmData.success === 1) {
              results.push({ channel: 'fcm', status: 'success', id: fcm.id });
            } else {
              if (fcmData.results?.[0]?.error === 'NotRegistered' || fcmData.results?.[0]?.error === 'InvalidRegistration') {
                await supabase.from('fcm_tokens').delete().eq('id', fcm.id);
              }
              results.push({ channel: 'fcm', status: 'error', id: fcm.id, message: fcmData.results?.[0]?.error || 'FCM error' });
            }
          } catch (e: any) {
            results.push({ channel: 'fcm', status: 'error', id: fcm.id, message: e.message });
          }
        }
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
