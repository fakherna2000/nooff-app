import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/providers';

export const metadata: Metadata = {
  title: 'مركز نوف لطب الأسنان',
  description: 'نظام إدارة مركز أسنان متكامل - إدارة المرضى والمواعيد وخطط العلاج',
  manifest: '/manifest.json',
  applicationName: 'مركز نوف',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'مركز نوف',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon-192.png',
  },
  openGraph: {
    title: 'مركز نوف لطب الأسنان',
    description: 'البوابة الإلكترونية للمرضى ولوحة التحكم الإدارية',
    type: 'website',
    locale: 'ar_SA',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { color: '#1a84f5' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            dir="rtl"
            toastOptions={{
              classNames: {
                toast: 'bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3',
                title: 'font-medium text-gray-900',
                description: 'text-sm text-gray-600',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
