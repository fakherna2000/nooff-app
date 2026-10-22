import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('clinic_settings')
      .select('clinic_name, logo_url, mobile_images, ui_texts')
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ data }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load clinic settings' },
      { status: 500, headers: corsHeaders }
    );
  }
}
