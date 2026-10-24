import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { sendFcmToTokens } from '@/lib/fcm-helper';
import { getApiUser } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    // بثّ إشعار لكل المستخدمين — للأدمن فقط
    const currentUser = await getApiUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: messageBody, data } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'الرجاء إدخال العنوان والرسالة' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const db = createAdminClient(supabaseUrl, serviceKey);
    const results: any[] = [];

    // === Web Push (للمتصفح) — جميع الاشتراكات ===
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@clinic.com';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (vapidPrivateKey && vapidPublicKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

      const { data: subscriptions } = await db
        .from('push_subscriptions')
        .select('*');

      const payload = JSON.stringify({
        title,
        body: messageBody,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: { ...data, broadcast: 'true' },
      });

      for (const sub of (subscriptions || []) as any[]) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          };
          const res = await webpush.sendNotification(pushSubscription as any, payload);
          results.push({ channel: 'web-push', status: 'success', id: sub.id, statusCode: res.statusCode });
        } catch (e: any) {
          if (e.statusCode === 410) {
            await db.from('push_subscriptions').delete().eq('id', sub.id);
          }
          results.push({ channel: 'web-push', status: 'error', id: sub.id, message: e.message });
        }
      }
    }

    // === Firebase Cloud Messaging — جميع التوكنات ===
    const { data: fcmTokens } = await db.from('fcm_tokens').select('id, token');

    const fcmResults = await sendFcmToTokens(
      (fcmTokens || []) as { id: string; token: string }[],
      title,
      messageBody,
      { ...data, broadcast: 'true' },
    );

    for (const r of fcmResults) {
      results.push({ channel: 'fcm', ...r });
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
