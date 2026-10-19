'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Gift,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoyaltyReward } from '@/lib/database.types';

const emptyForm = {
  title: '',
  description: '',
  points_cost: 10,
  image_url: '',
  is_active: true,
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LoyaltyReward | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/loyalty/rewards');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تحميل المكافآت');
      setRewards(json.data || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل المكافآت');
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

  const openEdit = (reward: LoyaltyReward) => {
    setEditing(reward);
    setForm({
      title: reward.title,
      description: reward.description || '',
      points_cost: reward.points_cost,
      image_url: reward.image_url || '',
      is_active: reward.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('الرجاء إدخال عنوان المكافأة');
      return;
    }
    const cost = Number(form.points_cost);
    if (!Number.isFinite(cost) || cost <= 0) {
      toast.error('تكلفة النقاط يجب أن تكون أكبر من صفر');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        points_cost: Math.trunc(cost),
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
      };
      const res = await fetch(
        editing ? `/api/admin/loyalty/rewards/${editing.id}` : '/api/admin/loyalty/rewards',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحفظ');
      toast.success(editing ? 'تم تحديث المكافأة' : 'تمت إضافة المكافأة');
      closeForm();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reward: LoyaltyReward) => {
    if (!confirm(`هل أنت متأكد من حذف مكافأة "${reward.title}"؟`)) return;
    setDeletingId(reward.id);
    try {
      const res = await fetch(`/api/admin/loyalty/rewards/${reward.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل الحذف');
      toast.success('تم حذف المكافأة');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (reward: LoyaltyReward) => {
    try {
      const res = await fetch(`/api/admin/loyalty/rewards/${reward.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !reward.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل التحديث');
      toast.success(reward.is_active ? 'تم تعطيل المكافأة' : 'تم تفعيل المكافأة');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل التحديث');
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">مكافآت الولاء</h1>
          <p className="text-gray-600 mt-1">إدارة كتالوج المكافآت التي يستبدلها المرضى من نقاطهم</p>
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">
          <Plus className="w-5 h-5" />
          مكافأة جديدة
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className="card text-center py-16">
          <Gift className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">لا توجد مكافآت بعد</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">أضف أول مكافأة ليستبدلها المرضى بنقاطهم</p>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-5 h-5" />
            إضافة مكافأة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rewards.map((reward) => (
            <div key={reward.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                {reward.image_url ? (
                  <div className="sm:w-32 h-32 sm:h-auto rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="sm:w-32 h-32 sm:h-auto rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-10 h-10 text-amber-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{reward.title}</h3>
                    <span
                      className={cn(
                        'badge whitespace-nowrap',
                        reward.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {reward.is_active ? 'مفعّلة' : 'معطّلة'}
                    </span>
                  </div>

                  {reward.description && (
                    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-amber-700 font-bold mb-4">
                    <Star className="w-4 h-4" />
                    {reward.points_cost} نقطة
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(reward)} className="btn-secondary text-sm !py-2">
                      <Edit3 className="w-4 h-4" /> تعديل
                    </button>
                    <button onClick={() => toggleActive(reward)} className="btn-secondary text-sm !py-2">
                      {reward.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => handleDelete(reward)}
                      disabled={deletingId === reward.id}
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
                {editing ? 'تعديل المكافأة' : 'مكافأة جديدة'}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto scrollbar-thin space-y-5">
              <div>
                <label className="label">عنوان المكافأة *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: خصم 10% على التنظيف"
                />
              </div>

              <div>
                <label className="label">الوصف</label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="تفاصيل المكافأة التي تظهر للمريض..."
                />
              </div>

              <div>
                <label className="label">تكلفة النقاط *</label>
                <input
                  type="number"
                  className="input"
                  dir="ltr"
                  min={1}
                  value={form.points_cost}
                  onChange={(e) => setForm((f) => ({ ...f, points_cost: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="label">رابط الصورة</label>
                <input
                  className="input"
                  dir="ltr"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
                {form.image_url ? (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
                    <img
                      src={form.image_url}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    اختياري - يمكن ترك المكافأة بدون صورة
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">حالة المكافأة</p>
                  <p className="text-xs text-gray-500">
                    {form.is_active ? 'ستظهر للمرضى في كتالوج المكافآت' : 'لن تظهر للمرضى حتى يتم تفعيلها'}
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
                      {editing ? 'حفظ التغييرات' : 'إضافة المكافأة'}
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
