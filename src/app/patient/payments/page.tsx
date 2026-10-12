'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientPaymentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/patient');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full" />
    </div>
  );
}
