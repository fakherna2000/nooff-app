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
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerAd } from '@/lib/database.types';

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'مطعم',
  pharmacy: 'صيدلية',
  lab: 'مختبر',
  store: 'متجر',
  other: 'أخرى',
};

const emptyForm = {
  title: '',
  description: '',
  category: 'other' as 'restaurant' | 'pharmacy' | 'lab' | 'store' | 'other',
  image_url: '',
  cta_label: '',
  target_url: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PartnerAd | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'restaurant' | 'pharmacy' | 'lab' | 'store' | 'other'>(
    'all'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تحميل الشركاء');
      setPartners(json.data || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل الشركاء');
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

  const openEdit = (partner: PartnerAd) => {
    setEditing(partner);
    setForm({
      title: partner.title,
      description: partner.description || '',
      category: partner.category,
      image_url: partner.image_url || '',
      cta_label: partner.cta_label || '',
      target_url: partner.target_url || '',
      is_active: partner.is_active,
      sort_order: partner.sort_order,
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
      formData.append('field', 'partner-ads');
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
      toast.error('الرجاء إدخال اسم الإعلان');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        image_url: form.image_url.trim() || null,
        cta_label: form.cta_label.trim() || null,
        target_url: form.target_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = await fetch(
        editing ? `/api/admin/partners/${editing.id}` : '/api/admin/partners',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحفظ');
      toast.success(editing ? 'تم تحديث الإعلان' : 'تمت إضافة الإعلان');
      closeForm();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner: PartnerAd) => {
    if (!confirm(`هل أنت متأكد من حذف إعلان "${partner.title}"؟`)) return;
    setDeletingId(partner.id);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحذف');
      toast.success('تم حذف الإعلان');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (partner: PartnerAd) => {
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !partner.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل التحديث');
      toast.success(partner.is_active ? 'تم تعطيل الإعلان' : 'تم تفعيل الإعلان');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل التحديث');
    }
  };

  const filtered = filter === 'all' ? partners : partners.filter((p) => p.category === filter);

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">شركاؤنا</h1>
          <p className="text-gray-600 mt-1">أضف إعلانات الشركاء التي تظهر للمرضى داخل التطبيق</p>
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">
          <Plus className="w-5 h-5" />
          إعلان شريك جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'الكل'],
          ['restaurant', 'مطاعم'],
          ['pharmacy', 'صيدليات'],
          ['lab', 'مختبرات'],
          ['store', 'متاجر'],
          ['other', 'أخرى'],
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
          <Building2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">لا توجد إعلانات شركاء بعد</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">أضف أول إعلان ليظهر داخل صفحة شركاؤنا</p>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-5 h-5" />
            إضافة إعلان
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((partner) => (
            <div key={partner.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                {partner.image_url ? (
                  <div className="sm:w-40 h-32 sm:h-auto rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={partner.image_url} alt={partner.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="sm:w-40 h-32 sm:h-auto rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-10 h-10 text-amber-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{partner.title}</h3>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="badge bg-amber-100 text-amber-700">
                        {CATEGORY_LABELS[partner.category]}
                      </span>
                      <span
                        className={cn(
                          'badge',
                          partner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {partner.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </div>
                  </div>

                  {partner.description && (
                    <p className="text-sm text-gray-600 mb-3">{partner.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                    {partner.cta_label && <span className="badge bg-gray-100 text-gray-600">زر: {partner.cta_label}</span>}
                    {partner.target_url && <span className="badge bg-gray-100 text-gray-600" dir="ltr">{partner.target_url}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(partner)} className="btn-secondary text-sm !py-2">
                      <Edit3 className="w-4 h-4" /> تعديل
                    </button>
                    <button onClick={() => toggleActive(partner)} className="btn-secondary text-sm !py-2">
                      {partner.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => handleDelete(partner)}
                      disabled={deletingId === partner.id}
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
                {editing ? 'تعديل إعلان الشريك' : 'إعلان شريك جديد'}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto scrollbar-thin space-y-5">
              <div>
                <label className="label">اسم الإعلان *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: صيدلية نوف"
                />
              </div>

              <div>
                <label className="label">الوصف</label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="وصف قصير للإعلان أو العرض"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">التصنيف *</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as 'restaurant' | 'pharmacy' | 'lab' | 'store' | 'other',
                      }))
                    }
                  >
                    <option value="restaurant">مطعم</option>
                    <option value="pharmacy">صيدلية</option>
                    <option value="lab">مختبر</option>
                    <option value="store">متجر</option>
                    <option value="other">أخرى</option>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">نص الزر</label>
                  <input
                    className="input"
                    value={form.cta_label}
                    onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                    placeholder="مثال: شاهد العرض"
                  />
                </div>
                <div>
                  <label className="label">الرابط الخارجي</label>
                  <input
                    className="input"
                    dir="ltr"
                    value={form.target_url}
                    onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="label">صورة الإعلان</label>
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
                  <p className="font-medium text-gray-900 text-sm">حالة الإعلان</p>
                  <p className="text-xs text-gray-500">
                    {form.is_active ? 'سيظهر للمرضى داخل صفحة شركاؤنا' : 'لن يظهر حتى يتم تفعيله'}
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
                      {editing ? 'حفظ التغييرات' : 'إضافة الإعلان'}
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
