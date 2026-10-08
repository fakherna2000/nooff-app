const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('===== مفاتيح VAPID للإشعارات الفورية =====\n');
console.log('VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('\n========================================\n');
console.log('قم بنسخ هذه المفاتيح إلى ملف .env.local');
