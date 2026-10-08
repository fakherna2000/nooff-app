const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Pure-Node PNG generator (رسم دائرة تدرج + حرف N للأسنان Placeholder)
// لأن sharp غير مثبت — ونريد ملفات PNG صالحة لـ PWA Install.
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size, color1, color2, label) {
  const w = size, h = size;
  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < w; x++) {
      // تدرج قطري
      const t = (x / (w - 1) + y / (h - 1)) / 2;
      let r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
      let g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
      let b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
      let a = 255;

      // دائرة ناعمة داخل الأيقونة
      const cx = w / 2, cy = h / 2;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rad = size * 0.42;
      if (dist > rad) {
        // خارج الدائرة: أبيض شفاف قليلاً للـ maskable
        const fade = Math.max(0, 1 - (dist - rad) / (size * 0.08));
        r = Math.round(r * fade + 255 * (1 - fade));
        g = Math.round(g * fade + 255 * (1 - fade));
        b = Math.round(b * fade + 255 * (1 - fade));
        a = Math.round(255 * Math.max(0, fade));
      }

      raw.push(r, g, b, a);
    }
  }

  const rawBuf = Buffer.from(raw);
  const compressed = zlib.deflateSync(rawBuf);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public');
  const primaryBlue = [26, 132, 245];   // #1a84f5
  const accentPurple = [217, 70, 239];  // #d946ef

  const files = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ];

  for (const f of files) {
    const buf = generatePng(f.size, primaryBlue, accentPurple, 'نوف');
    const p = path.join(outDir, f.name);
    fs.writeFileSync(p, buf);
    console.log('✅ تم إنشاء:', f.name, `(${f.size}x${f.size}, ${Math.round(buf.length / 1024)} كيلوبايت)`);
  }
}

main().catch((e) => {
  console.error('خطأ:', e);
  process.exit(1);
});
