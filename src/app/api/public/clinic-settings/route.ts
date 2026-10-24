import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    // قراءة عامة عبر عميل anon — جدول clinic_settings له سياسة قراءة عامة (RLS)،
    // فلا داعي لاستخدام service_role هنا.
    const supabase = createClient();
    const { data, error } = await supabase
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
