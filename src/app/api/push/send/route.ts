import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import crypto from 'crypto';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFcmAccessToken(): Promise<string | null> {
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY;
  const projectId = process.env.FCM_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) return null;

  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
    return cachedAccessToken.token;
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(privateKey).toString('base64url');
  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(jwt)}`,
  });

  const tokenData = await tokenRes.json();
  if (tokenData.access_token) {
    cachedAccessToken = { token: tokenData.access_token, expiresAt: now + 3000 };
    return tokenData.access_token;
  }
  return null;
}

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

    // === Firebase Cloud Messaging V1 API (لتطبيق الأندرويد) ===
    const fcmProjectId = process.env.FCM_PROJECT_ID;
    if (fcmProjectId) {
      const accessToken = await getFcmAccessToken();
      if (accessToken) {
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
              const fcmRes = await fetch(
                `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    message: {
                      token: fcm.token,
                      notification: { title, body: messageBody },
                      data: { ...data, patient_id },
                      android: {
                        priority: 'high',
                        notification: { channel_id: 'default', click_action: 'OPEN_APP' },
                      },
                    },
                  }),
                },
              );
              if (fcmRes.ok) {
                results.push({ channel: 'fcm', status: 'success', id: fcm.id });
              } else {
                const fcmData = await fcmRes.json();
                const errCode = fcmData?.error?.details?.[0]?.errorCode;
                if (errCode === 'UNREGISTERED' || errCode === 'INVALID_ARGUMENT') {
                  await supabase.from('fcm_tokens').delete().eq('id', fcm.id);
                }
                results.push({ channel: 'fcm', status: 'error', id: fcm.id, message: fcmData?.error?.message || 'FCM error' });
              }
            } catch (e: any) {
              results.push({ channel: 'fcm', status: 'error', id: fcm.id, message: e.message });
            }
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
