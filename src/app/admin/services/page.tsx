'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClinicService } from '@/lib/database.types';

const CATEGORY_LABELS: Record<string, string> = {
  dental: 'طب الأسنان',
  beauty: 'التجميل',
};

const emptyForm = {
  title: '',
  description: '',
  category: 'dental' as 'dental' | 'beauty',
  image_url: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClinicService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'dental' | 'beauty'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تحميل الخدمات');
      setServices(json.data || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل الخدمات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (service: ClinicService) => {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description || '',
      category: service.category,
      image_url: service.image_url || '',
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('الملف المختار ليس صورة');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', 'clinic-services');
      const res = await fetch('/api/admin/settings/upload-image', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.data?.publicUrl) {
        throw new Error(json.error || 'فشل رفع الصورة');
      }
      setForm((f) => ({ ...f, image_url: json.data.publicUrl }));
      toast.success('تم رفع الصورة');
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('الرجاء إدخال اسم الخدمة');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = await fetch(
        editing ? `/api/admin/services/${editing.id}` : '/api/admin/services',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحفظ');
      toast.success(editing ? 'تم تحديث الخدمة' : 'تمت إضافة الخدمة');
      closeForm();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: ClinicService) => {
    if (!confirm(`هل أنت متأكد من حذف خدمة "${service.title}"؟`)) return;
    setDeletingId(service.id);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحذف');
      toast.success('تم حذف الخدمة');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (service: ClinicService) => {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل التحديث');
      toast.success(service.is_active ? 'تم تعطيل الخدمة' : 'تم تفعيل الخدمة');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل التحديث');
    }
  };

  const filtered = filter === 'all' ? services : services.filter((s) => s.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الخدمات</h1>
          <p className="text-gray-600 mt-1">أضف أو احذف الخدمات التي تظهر للمرضى في التطبيق</p>
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">
          <Plus className="w-5 h-5" />
          خدمة جديدة
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'الكل'],
          ['dental', 'طب الأسنان'],
          ['beauty', 'التجميل'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
              filter === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ImageIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">لا توجد خدمات بعد</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">أضف أول خدمة لتظهر للمرضى في التطبيق</p>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-5 h-5" />
            إضافة خدمة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((service) => (
            <div key={service.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                {service.image_url ? (
                  <div className="sm:w-32 h-32 sm:h-auto rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="sm:w-32 h-32 sm:h-auto rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-10 h-10 text-amber-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{service.title}</h3>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="badge bg-amber-100 text-amber-700">
                        {CATEGORY_LABELS[service.category]}
                      </span>
                      <span
                        className={cn(
                          'badge',
                          service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {service.is_active ? 'مفعّلة' : 'معطّلة'}
                      </span>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(service)} className="btn-secondary text-sm !py-2">
                      <Edit3 className="w-4 h-4" /> تعديل
                    </button>
                    <button onClick={() => toggleActive(service)} className="btn-secondary text-sm !py-2">
                      {service.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      disabled={deletingId === service.id}
                      className="btn-danger text-sm !py-2"
                    >
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
          onClick={closeForm}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {editing ? 'تعديل الخدمة' : 'خدمة جديدة'}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto scrollbar-thin space-y-5">
              <div>
                <label className="label">اسم الخدمة *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: تبييض الأسنان"
                />
              </div>

              <div>
                <label className="label">الوصف</label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="وصف قصير يظهر تحت اسم الخدمة"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">التصنيف *</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as 'dental' | 'beauty' }))
                    }
                  >
                    <option value="dental">طب الأسنان</option>
                    <option value="beauty">التجميل</option>
                  </select>
                </div>
                <div>
                  <label className="label">ترتيب الظهور</label>
                  <input
                    type="number"
                    className="input"
                    dir="ltr"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">صورة الخدمة</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />
                {form.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 h-40">
                    <img src={form.image_url} alt="معاينة" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                    <span className="text-sm">{uploading ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}</span>
                  </button>
                )}
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary text-sm !py-2 mt-3"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    استبدال الصورة
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">حالة الخدمة</p>
                  <p className="text-xs text-gray-500">
                    {form.is_active ? 'ستظهر للمرضى في التطبيق' : 'لن تظهر للمرضى حتى يتم تفعيلها'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={cn(
                    'relative w-14 h-7 rounded-full transition-colors',
                    form.is_active ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                      form.is_active ? 'translate-x-0.5' : 'translate-x-7'
                    )}
                  />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">
                  إلغاء
                </button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                  {saving ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editing ? 'حفظ التغييرات' : 'إضافة الخدمة'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
