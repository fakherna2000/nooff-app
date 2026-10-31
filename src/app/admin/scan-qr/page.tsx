'use client';

import QRCode from 'react-qr-code';
import Link from 'next/link';
import { ArrowLeft, Printer, QrCode } from 'lucide-react';
import { CLINIC_QR_TOKEN, CLINIC_QR_POINTS } from '@/lib/loyalty-qr';

export default function AdminScanQrPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #noof-qr-print, #noof-qr-print * { visibility: visible !important; }
          #noof-qr-print {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 16px !important;
            text-align: center !important;
          }
        }
      `}</style>

      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary-600" />
            QR نقاط العيادة
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            اطبع هذا الرمز وعلّقه في العيادة — عندما يقرأه المريض من تطبيقه تُضاف{' '}
            {CLINIC_QR_POINTS} نقطتان إلى محفظته.
          </p>
        </div>
      </div>

      <div className="card bg-white border border-gray-100 rounded-2xl p-8 flex flex-col items-center gap-4">
        <div id="noof-qr-print" className="flex flex-col items-center gap-4 bg-white p-4">
          <div className="text-lg font-bold text-gray-900">امسح الرمز واحصل على {CLINIC_QR_POINTS} نقاط</div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100">
            <QRCode value={CLINIC_QR_TOKEN} size={240} />
          </div>
          <div className="text-xs text-gray-400" dir="ltr">
            {CLINIC_QR_TOKEN}
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-5 py-3 font-medium hover:bg-primary-700 transition-colors"
        >
          <Printer className="w-5 h-5" />
          طباعة الرمز
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 leading-relaxed">
        ملاحظة: الرمز ثابت ولا يتغيّر. كل عملية قراءة ناجحة تضيف {CLINIC_QR_POINTS} نقطتين للمحفظة.
      </div>
    </div>
  );
}
