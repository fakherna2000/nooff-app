import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendFcmToTokens } from '@/lib/fcm-helper';
import { POINTS_PER_BOOKING } from '@/lib/loyalty';
import webpush from 'web-push';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const role = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const admin = createAdminClient();

  // جلب بيانات الموعد قبل التحديث لاستخدامها في الإشعار
  const { data: apptData } = await admin
    .from('appointments')
    .select('id, patient_id, appointment_date, appointment_time, type, status')
    .eq('id', params.id)
    .single();

  const appt = apptData as any;
  const wasAlreadyScheduled = appt?.status === 'scheduled';

  const { error } = await admin
    .from('appointments')
    // @ts-expect-error - service role client update typing issue
    .update({ status: 'scheduled' })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // احتساب نقاط الولاء عند تأكيد الموعد (مرة واحدة فقط لكل موعد)
  if (appt?.patient_id && !wasAlreadyScheduled) {
    try {
      await (admin as any).rpc('loyalty_adjust_points', {
        p_patient_id: appt.patient_id,
        p_points: POINTS_PER_BOOKING,
        p_type: 'earn',
        p_reason: 'نقاط تأكيد موعد',
        p_appointment_id: appt.id,
      });
    } catch (e) {
      console.error('Failed to award loyalty points:', e);
    }
  }

  // إرسال إشعار تلقائي للمريض عند تأكيد موعده (FCM للأندرويد + Web Push للآيفون والمتصفح)
  if (appt?.patient_id) {
    try {
      const dateStr = appt.appointment_date;
      const formattedDate = dateStr
        ? new Date(dateStr).toLocaleDateString('ar-SA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : '';
      const notifTitle = 'تم تأكيد موعدك';
      const notifBody = `موعدك بتاريخ ${formattedDate} الساعة ${appt.appointment_time} (${appt.type || 'فحص'}) تم تأكيده`;
      const notifData = { appointment_id: appt.id, appointment_date: appt.appointment_date };

      // Web Push (للآيفون PWA والمتصفح)
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidPrivateKey && vapidPublicKey) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@noof-clinic.com',
          vapidPublicKey,
          vapidPrivateKey,
        );

        const { data: subs } = await admin
          .from('push_subscriptions')
          .select('id, endpoint, keys_p256dh, keys_auth')
          .eq('patient_id', appt.patient_id);

        const payload = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { ...notifData, patient_id: appt.patient_id },
        });

        for (const sub of (subs || []) as any[]) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
              } as any,
              payload,
            );
          } catch (e: any) {
            if (e?.statusCode === 410 || e?.statusCode === 404) {
              await admin.from('push_subscriptions').delete().eq('id', sub.id);
            }
            console.error('Failed to send appointment confirmation Web Push:', e?.message || e);
          }
        }
      }

      // FCM (لتطبيق الأندرويد)
      const { data: tokens } = await admin
        .from('fcm_tokens')
        .select('id, token')
        .eq('patient_id', appt.patient_id);

      if (tokens && tokens.length > 0) {
        await sendFcmToTokens(
          tokens as { id: string; token: string }[],
          notifTitle,
          notifBody,
          notifData,
          appt.patient_id,
        );
      }
    } catch (e) {
      console.error('Failed to send appointment confirmation notification:', e);
    }
  }

  return NextResponse.json({ success: true });
}
