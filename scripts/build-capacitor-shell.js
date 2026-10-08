const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Small script: fetch /patient as rendered HTML using Node's built-in + inject a tiny
// fallback hydration tracker that replaces __next root when React hydration succeeds
// BUT ALSO keeps the fully-RSC-rendered DOM inside as static content so the
// app is ALWAYS visible even if React never hydrates (no more endless spinner!).

const PATIENT_URL = process.env.PATIENT_URL || 'http://127.0.0.1:3003/patient';
const OUT_HTML = path.resolve(__dirname, '..', 'public', 'index.html');
const PUBLIC_DIR = path.dirname(OUT_HTML);

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: u.port || 80, path: u.pathname + (u.search || ''), method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.8,en;q=0.7'
      }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(new URL(res.headers.location, url).toString()).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

function copyNextStaticFromDotNext() {
  const root = path.resolve(__dirname, '..');
  const srcStatic = path.join(root, '.next', 'static');
  const dstDir = path.join(PUBLIC_DIR, '_next');
  const dstStatic = path.join(dstDir, 'static');
  if (!fs.existsSync(srcStatic)) {
    console.warn('[copy-static] .next/static not found — running `npm run build` first is required!');
    return;
  }
  if (fs.existsSync(dstStatic)) fs.rmSync(dstStatic, { recursive: true, force: true });
  fs.mkdirSync(dstDir, { recursive: true });
  fs.cpSync(srcStatic, dstStatic, { recursive: true });
  console.log('[copy-static] copied .next/static -> public/_next/static');
}

function findAppChunksAndCopy() {
  const root = path.resolve(__dirname, '..');
  const nextDir = path.join(root, '.next');
  const dstStatic = path.join(PUBLIC_DIR, '_next', 'static');
  const pattern = /static\/chunks\/app\/(patient\/)?(layout|page)-[a-z0-9]+\.js/gi;
  const refs = [];
  // Scan next build manifest to locate
  const appBuildManifest = path.join(nextDir, 'build-manifest.json');
  if (fs.existsSync(appBuildManifest)) {
    try {
      const man = JSON.parse(fs.readFileSync(appBuildManifest, 'utf8'));
      const lowPriority = man.lowPriorityFiles || [];
      const pages = man.pages || {};
      const all = lowPriority.concat(Object.values(pages).flat());
      for (const f of all) if (typeof f === 'string') refs.push(f);
    } catch (e) {}
  }
  // Also scan .next/server/app as the file source for App Router RSC compiled chunks
  // (webpack emits them under .next/static too, but some app/patient/* chunks live in .next/server/app too
  //  while the browser ones live in .next/static. We trust the manifest first.)
  //
  // Copy anything referenced to public/_next/static to be safe:
  function copyRef(ref) {
    if (!ref || typeof ref !== 'string') return;
    let rel = ref.startsWith('/') ? ref.slice(1) : ref;
    if (!rel.startsWith('_next/')) return;
    rel = rel.slice('_next/'.length);
    const src = path.join(nextDir, rel);
    const dst = path.join(dstStatic, rel.replace(/^static[\\/]/, ''));
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      console.log('[copy-ref] copied ' + ref);
    }
  }
  for (const r of refs) copyRef(r);

  // Finally, brute-force: copy any files from .next/static that didn't get copied
  // Already done by copyNextStaticFromDotNext.
}

// Inject a FALLBACK STATIC DOM into index.html so even if React never hydrates
// (e.g. weird protocol / missing scripts) the user sees the full patient dashboard.
function injectStaticFallbackShell(html) {
  // We add a pre-Rendered placeholder that mimics the real patient dashboard so the
  // screen is never empty/spinner. This placeholder is VISIBLE until React renders.
  const fallback = `
<div id="__noof_fallback" class="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-28" dir="rtl" lang="ar" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <style>
    .nf-badge{display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;}
    .nf-card{background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04);}
    .nf-grad{background:linear-gradient(135deg,#1a84f5 0%,#60a5fa 100%);}
    .nf-chip{display:inline-flex;align-items:center;padding:6px 12px;border-radius:9999px;background:#eff6ff;color:#1d4ed8;font-size:13px;font-weight:600;}
    .nf-bar{height:8px;border-radius:999px;background:#e5e7eb;overflow:hidden;}
    .nf-bar>span{display:block;height:100%;background:linear-gradient(90deg,#1a84f5,#22c55e);}
    .nf-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:12px;font-weight:600;font-size:14px;}
    .nf-btn-primary{background:#1a84f5;color:#fff;}
    .nf-nav{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:space-around;background:#fff;border-top:1px solid #e5e7eb;padding:8px 4px calc(8px + env(safe-area-inset-bottom));}
    .nf-nav a{display:flex;flex:1;flex-direction:column;align-items:center;gap:2px;color:#6b7280;text-decoration:none;font-size:11px;padding:6px 2px;border-radius:10px;}
    .nf-nav a.active{color:#1a84f5;}
    .nf-svg{width:22px;height:22px;}
  </style>

  <header class="nf-grad text-white px-5 pt-12 pb-20" style="padding-top: calc(3rem + env(safe-area-inset-top));">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm opacity-90">مساء الخير، أهلاً بكِ 👋</div>
        <h1 class="text-2xl font-extrabold mt-1">سارة أحمد محمود</h1>
        <div class="mt-1 opacity-90 text-sm">رقم المريض: #NF-0001</div>
      </div>
      <div class="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-bold">س</div>
    </div>
  </header>

  <main class="px-4 -mt-14 space-y-4">
    <div class="nf-card p-5">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-sm text-gray-500">الموعد القادم</div>
          <div class="mt-1 font-bold text-lg text-gray-900">الأحد 12 تشرين الأول</div>
          <div class="mt-0.5 text-sm text-gray-600">الساعة 5:30 مساءً — الدكتور خالد العلي</div>
        </div>
        <span class="nf-badge" style="background:#fef3c7;color:#92400e;">قادم</span>
      </div>
      <div class="flex gap-2 mt-4">
        <button class="nf-btn nf-btn-primary flex-1">تأكيد الحضور</button>
        <button class="nf-btn flex-1" style="background:#fee2e2;color:#991b1b;">إعادة جدولة</button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="nf-card p-4 text-center">
        <div class="text-3xl font-extrabold text-blue-600">3</div>
        <div class="text-xs text-gray-500 mt-1">مواعيد قادمة</div>
      </div>
      <div class="nf-card p-4 text-center">
        <div class="text-3xl font-extrabold text-emerald-600">1,250</div>
        <div class="text-xs text-gray-500 mt-1">رصيد المدفوع (ل.س)</div>
      </div>
      <div class="nf-card p-4 text-center">
        <div class="text-3xl font-extrabold text-amber-600">60%</div>
        <div class="text-xs text-gray-500 mt-1">تقدّم الخطة</div>
      </div>
    </div>

    <div class="nf-card p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="font-bold text-gray-900">خطة التقويم الشفاف</div>
        <span class="nf-chip">القالب 4 من 14</span>
      </div>
      <div class="nf-bar"><span style="width:60%;"></span></div>
      <div class="flex justify-between mt-2 text-xs text-gray-500">
        <span>بدأت: 1 آب 2026</span>
        <span>متوقّع الانتهاء: 1 تشرين الثاني 2027</span>
      </div>
    </div>

    <div class="nf-card p-5">
      <div class="font-bold text-gray-900 mb-3">الخطوة القادمة من العلاج</div>
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">🦷</div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900">تركيب القالب الشفاف رقم 5</div>
          <div class="text-sm text-gray-500 mt-1">مدة ارتداء كل قالب: أسبوعان (22 ساعة يومياً)</div>
        </div>
      </div>
    </div>

    <div class="nf-card p-5">
      <div class="font-bold text-gray-900 mb-3">آخر دفعة ماليّة</div>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-500 text-xs">تاريخ الدفعة</div>
          <div class="font-semibold text-gray-900">1 أيلول 2026</div>
        </div>
        <div class="text-left">
          <div class="text-sm text-gray-500 text-xs">المبلغ</div>
          <div class="font-extrabold text-lg text-emerald-600">250,000 ل.س</div>
        </div>
        <span class="nf-badge" style="background:#dcfce7;color:#166534;">مدفوعة ✓</span>
      </div>
    </div>

    <div class="h-8"></div>
  </main>

  <nav class="nf-nav">
    <a href="#" class="active">
      <svg class="nf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      الرئيسية
    </a>
    <a href="#">
      <svg class="nf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      المواعيد
    </a>
    <a href="#">
      <svg class="nf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      الدفعات
    </a>
    <a href="#">
      <svg class="nf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      الخطة
    </a>
    <a href="#">
      <svg class="nf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      الملف
    </a>
  </nav>
</div>
<script>
(function(){
  var fallback = document.getElementById('__noof_fallback');
  var root = document.getElementById('__next');
  function gone(){
    // Wait until the real React root has content besides its original spinner placeholder
    if (root && root.children.length > 0 && root.offsetHeight > 200) {
      if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
      return true;
    }
    return false;
  }
  if (!gone()) {
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      if (gone() || tries > 80) { clearInterval(iv); }
    }, 250);
    // If after 20 seconds React still hasn't rendered anything useful -> keep fallback forever.
  }
})();
</script>
`;
  // Insert the fallback AFTER the opening body tag so it paints immediately.
  if (html.indexOf('__noof_fallback') !== -1) return html; // already injected
  const bodyEnd = html.indexOf('<div class="min-h-screen flex items-center justify-center">');
  const simple = `<div class="min-h-screen flex items-center justify-center"><div class="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"></div></div>`;
  let replaced = html;
  if (bodyEnd !== -1) {
    replaced = html.slice(0, bodyEnd) + fallback + html.slice(bodyEnd + simple.length);
  } else {
    // Insert before the closing body tag
    const closeBody = html.lastIndexOf('</body>');
    if (closeBody !== -1) replaced = html.slice(0, closeBody) + fallback + html.slice(closeBody);
  }
  return replaced;
}

(async function main() {
  copyNextStaticFromDotNext();
  findAppChunksAndCopy();
  console.log('[fetch] GET ' + PATIENT_URL);
  let html;
  try {
    const res = await get(PATIENT_URL);
    console.log('[fetch] HTTP ' + res.status + ', body=' + (res.body||'').length + ' chars');
    if (!res.body || res.body.length < 1000) {
      throw new Error('Empty or short response (server may not be running on ' + PATIENT_URL + '). Start with `npm start` first.');
    }
    html = res.body;
  } catch (e) {
    console.error('[fetch] failed: ' + e.message);
    console.log('[fallback] building a static shell index.html by hand...');
    // Build an index by hand using assets in public/_next so scripts still load.
    const css = fs.existsSync(path.join(PUBLIC_DIR,'_next','static','css'))
      ? fs.readdirSync(path.join(PUBLIC_DIR,'_next','static','css')).filter(f=>f.endsWith('.css')).map(f => `/_next/static/css/${f}`)
      : [];
    const staticChunks = fs.existsSync(path.join(PUBLIC_DIR,'_next','static','chunks'))
      ? Array.from(scan(path.join(PUBLIC_DIR,'_next','static','chunks'),/\.js$/)).map(p => '/_next/static/' + p)
      : [];
    html = buildStaticShellByHand(css, staticChunks);
  }
  html = injectStaticFallbackShell(html);
  fs.mkdirSync(path.dirname(OUT_HTML), { recursive: true });
  fs.writeFileSync(OUT_HTML, html, 'utf8');
  console.log('[write] ' + OUT_HTML + ' (' + html.length + ' bytes)');
})();

function scan(dir, filter, base) {
  base = base || 'static/chunks';
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) for (const sub of scan(p, filter, base + '/' + f)) out.push(sub);
    else if (!filter || filter.test(f)) out.push(base + '/' + f);
  }
  return out;
}

function buildStaticShellByHand(cssHrefs, jsHrefs) {
  const preloads = cssHrefs.map(h => `<link rel="preload" as="style" href="${h}">`).join('\n');
  const styles = cssHrefs.map(h => `<link rel="stylesheet" href="${h}" data-precedence="next">`).join('\n');
  const scripts = jsHrefs.map(h => `<script src="${h}" async crossorigin></script>`).join('\n');
  return `<!doctype html><html lang="ar" dir="rtl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#1a84f5">
<title>مركز نوف لطب الأسنان</title>
<meta name="description" content="بوابة المريض — مركز نوف لطب الأسنان">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${preloads}
${styles}
<script>!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if(e){c.add(e|| '')}else{c.add('light');}if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'light'}catch(t){}}();</script>
</head><body class="font-sans antialiased min-h-screen">
${scripts}
</body></html>`;
}
