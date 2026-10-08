const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const iconSvgPath = path.join(__dirname, '..', 'public', 'icon.svg');
  if (!fs.existsSync(iconSvgPath)) {
    console.error('icon.svg غير موجود في public/icon.svg');
    process.exit(1);
  }

  const svg = fs.readFileSync(iconSvgPath);

  const sizes = [
    { size: 192, out: 'icon-192.png' },
    { size: 512, out: 'icon-512.png' },
    { size: 180, out: 'apple-touch-icon.png' },
  ];

  for (const s of sizes) {
    const outPath = path.join(__dirname, '..', 'public', s.out);
    await sharp(svg, { density: 300 })
      .resize(s.size, s.size)
      .png()
      .toFile(outPath);
    console.log('تم إنشاء:', s.out, 'الحجم:', s.size, '×', s.size);
  }

  console.log('✅ تم إنشاء الأيقونات بنجاح');
}

main().catch((e) => {
  console.error('فشل إنشاء الأيقونات:', e.message);
  console.log('محاولة استخدام طريقة بديلة (Canvas) أو توليد PNG placeholder...');
});
