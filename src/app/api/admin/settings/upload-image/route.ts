import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'clinic-mobile-images';

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'متغيرات Supabase غير مكتملة على البيئة الحالية' },
      { status: 500 }
    );
  }

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

  const formData = await request.formData();
  const file = formData.get('file');
  const field = String(formData.get('field') || 'general');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'لم يتم اختيار صورة' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'الملف المختار ليس صورة' }, { status: 400 });
  }

  const admin = createAdminClient() as any;

  const { data: buckets, error: listBucketsError } = await admin.storage.listBuckets();
  if (listBucketsError) {
    return NextResponse.json(
      { error: `تعذر قراءة مساحة التخزين: ${listBucketsError.message}` },
      { status: 500 }
    );
  }

  const existingBucket = Array.isArray(buckets)
    ? buckets.find((bucket: { name?: string; id?: string }) =>
        bucket.name === BUCKET_NAME || bucket.id === BUCKET_NAME
      )
    : null;

  if (!existingBucket) {
    const { error: bucketError } = await admin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (bucketError) {
      return NextResponse.json(
        { error: `تعذر تجهيز مساحة رفع الصور: ${bucketError.message}` },
        { status: 500 }
      );
    }
  }

  const safeField = field.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filePath = `${safeField}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin
    .storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    return NextResponse.json({ error: `فشل رفع الصورة: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return NextResponse.json({
    data: {
      bucket: BUCKET_NAME,
      path: filePath,
      publicUrl: data.publicUrl,
    },
  });
}
