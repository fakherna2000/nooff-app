import crypto from 'crypto';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getFcmAccessToken(): Promise<string | null> {
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

export interface SendFcmResult {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

export async function sendFcmToTokens(
  tokens: { id: string; token: string }[],
  title: string,
  body: string,
  extraData?: Record<string, any>,
  patientId?: string,
): Promise<SendFcmResult[]> {
  const fcmProjectId = process.env.FCM_PROJECT_ID;
  if (!fcmProjectId) return [];

  const accessToken = await getFcmAccessToken();
  if (!accessToken) return [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  const results: SendFcmResult[] = [];

  for (const fcm of tokens) {
    try {
      const stringData: Record<string, string> = {};
      if (extraData && typeof extraData === 'object') {
        for (const [k, v] of Object.entries(extraData)) {
          stringData[k] = String(v);
        }
      }
      if (patientId) stringData.patient_id = String(patientId);
      stringData.title = title;
      stringData.body = body;

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
              data: stringData,
              android: { priority: 'high' },
            },
          }),
        },
      );

      if (fcmRes.ok) {
        results.push({ id: fcm.id, status: 'success' });
      } else {
        const fcmData = await fcmRes.json();
        const errCode = fcmData?.error?.details?.[0]?.errorCode;
        if ((errCode === 'UNREGISTERED' || errCode === 'INVALID_ARGUMENT') && supabase) {
          await supabase.from('fcm_tokens').delete().eq('id', fcm.id);
        }
        results.push({ id: fcm.id, status: 'error', message: fcmData?.error?.message || 'FCM error' });
      }
    } catch (e: any) {
      results.push({ id: fcm.id, status: 'error', message: e.message });
    }
  }

  return results;
}
