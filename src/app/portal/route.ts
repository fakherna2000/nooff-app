import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// تقديم بوابة المريض الثابتة (نفس الملف المستخدم داخل تطبيق الأندرويد)
// تُبنى مرة واحدة وقت البناء (static) لتفادي أي قراءة ملفات وقت التشغيل.
export const dynamic = 'force-static';

export async function GET() {
  const html = readFileSync(join(process.cwd(), 'public', 'patient', 'index.html'), 'utf8');

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
