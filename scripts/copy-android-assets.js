const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const SRC_512 = path.join(PROJECT_ROOT, '..', 'public', 'icon-512.png');
const SRC_192 = path.join(PROJECT_ROOT, '..', 'public', 'icon-192.png');
const ANDROID_RES = path.join(PROJECT_ROOT, '..', 'android', 'app', 'src', 'main', 'res');

const sizeMap = {
  'mipmap-mdpi':    { launcher: 48,  foreground: 108 },
  'mipmap-hdpi':    { launcher: 72,  foreground: 162 },
  'mipmap-xhdpi':   { launcher: 96,  foreground: 216 },
  'mipmap-xxhdpi':  { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

function copyFile(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`✓ ${path.relative(ANDROID_RES, dest)}`);
  } catch (err) {
    console.error(`✗ خطأ في نسخ ${dest}:`, err.message);
  }
}

if (!fs.existsSync(SRC_512)) {
  console.error('الملف المصدر icon-512.png غير موجود!');
  process.exit(1);
}

// نسخ أيقونات mipmap: نستخدم icon-512.png كـ base لجميع الأحجام (Android سيقوم بالتحجيم تلقائياً بشكل جيد)
for (const [folder] of Object.entries(sizeMap)) {
  const folderPath = path.join(ANDROID_RES, folder);
  // نسخ ic_launcher.png
  copyFile(SRC_512, path.join(folderPath, 'ic_launcher.png'));
  // نسخ ic_launcher_round.png
  copyFile(SRC_512, path.join(folderPath, 'ic_launcher_round.png'));
  // نسخ ic_launcher_foreground.png (للـ Adaptive Icons)
  copyFile(SRC_512, path.join(folderPath, 'ic_launcher_foreground.png'));
}

// نسخ أيقونة splash screen لكل مجلدات drawable
const drawableFolders = [
  'drawable',
  'drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi',
  'drawable-port-xxhdpi', 'drawable-port-xxxhdpi',
  'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi',
  'drawable-land-xxhdpi', 'drawable-land-xxxhdpi',
];
for (const folder of drawableFolders) {
  copyFile(SRC_512, path.join(ANDROID_RES, folder, 'splash.png'));
}

console.log('\n✅ تم نسخ جميع أيقونات التطبيق الأصلية بنجاح!');
