'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { usePatients } from '@/hooks/useData';
import { toast } from 'sonner';

export default function NewPatientPage() {
  const router = useRouter();
  const { createPatient } = usePatients();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '' as '' | 'male' | 'female',
    address: '',
    medical_history: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    setSubmitting(true);
    try {
      const data: any = {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        medical_history: form.medical_history || null,
        notes: form.notes || null,
      };
      const patient = await createPatient(data);
      toast.success('تمت إضافة المريض بنجاح');
      router.replace(`/admin/patients/${patient.id}`);
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء إضافة المريض');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/patients"
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إضافة مريض جديد</h1>
          <p className="text-gray-600 mt-1">أدخل بيانات المريض الأساسية</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-600" />
            البيانات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">الاسم الكامل *</label>
              <input
                type="text"
                className="input"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="مثال: أحمد محمد علي"
              />
            </div>
            <div>
              <label className="label">رقم الهاتف *</label>
              <input
                type="tel"
                dir="ltr"
                className="input text-right"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="05XXXXXXXX"
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                dir="ltr"
                className="input text-right"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="label">تاريخ الميلاد</label>
              <input
                type="date"
                className="input"
                value={form.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <label className="label">الجنس</label>
              <div className="flex gap-3">
                {[
                  { v: 'male', l: 'ذكر' },
                  { v: 'female', l: 'أنثى' },
                ].map((g) => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => handleChange('gender', g.v)}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                      form.gender === g.v
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">العنوان</label>
              <input
                type="text"
                className="input"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="المدينة، الحي، الشارع..."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-5">معلومات طبية</h2>
          <div className="space-y-5">
            <div>
              <label className="label">التاريخ المرضي</label>
              <textarea
                className="input min-h-[100px] resize-y"
                value={form.medical_history}
                onChange={(e) => handleChange('medical_history', e.target.value)}
                placeholder="أي أمراض مزمنة، حساسية، عمليات سابقة..."
              />
            </div>
            <div>
              <label className="label">ملاحظات</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="ملاحظات إضافية عن المريض..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Link href="/admin/patients" className="btn-secondary">
            إلغاء
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary min-w-[140px]">
            {submitting ? (
              <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ البيانات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
