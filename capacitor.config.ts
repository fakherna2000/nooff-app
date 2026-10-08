import type { CapacitorConfig } from '@capacitor/cli';

/**
 * إعدادات Capacitor لتطبيق مركز نوف لطب الأسنان
 *
 * تبديل بين التطوير والإنتاج عبر متغير البيئة CAPACITOR_ENV:
 *   • development: يتصّل بالسيرفر المحلي 192.168.1.209:3003
 *   • production:  لا يحدد url → يعمل مع الملفات المضمنة داخله + Service Worker
 *                  يعمل بدون إنترنت بعد أول تشغيل.
 */

const APP_ENV = (process.env.CAPACITOR_ENV || 'development') as 'development' | 'production';

const DEV_SERVER_URL = process.env.CAPACITOR_DEV_URL || 'http://192.168.1.209:3003/patient';
const PROD_SERVER_URL = process.env.CAPACITOR_PROD_URL || 'https://your-domain.vercel.app/patient';

const isDev = APP_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.noof.dental.clinic',
  appName: 'مركز نوف',
  webDir: 'public',

  android: {
    backgroundColor: '#ffffff',
  },

  server: {
    androidScheme: 'https',
    // iOS uses https by default via capacitor:// scheme. We allow cleartext for
    // any future dev server overrides but keep production loading from
    // bundled assets (capacitor handles the local asset scheme automatically).
    cleartext: true,
    allowNavigation: ['localhost', '127.0.0.1', 'appassets.androidplatform.net'],
    // =========================================================================
    // 📱 iOS: على iOS، Capacitor يستخدم مخطط capacitor:// افتراضيًا لتقديم
    //     الملفات المضمّنة مباشرة من WKWebView بدون أي خادم محلي جافا — ما نحتاجه
    //     إلى أي خادم منفصل على iOS. نحذف الرابط الثابت 127.0.0.1:18080 فقط
    //     على الأندرويد (خادم الجافا خاص بالأندرويد فقط)، ونسمح لـ iOS بتحميل
    //     صفحتنا الثابتة /patient/index.html مباشرة من الأصول عبر
    //     Capacitor scheme الأصلي — الذي يشغّلها 100% بدون شاشات بيضاء ولا
    //     سبينرات.
    // =========================================================================
    url: undefined,
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a84f5',
    // تضمين الخلفية الزرقاء مع شاشة الـ Splash نفس الإعدادات مثل الأندرويد
    // (SplashScreen على iOS يتم توليده عبر Assets.xcassets في Xcode)
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#1a84f5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1a84f5',
      overlaysWebView: false,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
