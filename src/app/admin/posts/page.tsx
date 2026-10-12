'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePosts } from '@/hooks/useData';
import type { Post } from '@/lib/database.types';
import { toast } from 'sonner';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Megaphone,
  Tag,
  Lightbulb,
  FileText,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const POST_TYPES = [
  { value: 'offer', label: 'عرض', icon: Tag, color: 'text-green-600 bg-green-50' },
  { value: 'ad', label: 'إعلان', icon: Megaphone, color: 'text-blue-600 bg-blue-50' },
  { value: 'tip', label: 'نصيحة', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'general', label: 'منشور', icon: FileText, color: 'text-purple-600 bg-purple-50' },
] as const;

type PostType = (typeof POST_TYPES)[number]['value'];

const emptyForm = {
  title: '',
  body: '',
  image_url: '',
  type: 'general' as PostType,
  is_published: true,
};

export default function AdminPostsPage() {
  const { getAllPosts, createPost, updatePost, deletePost } = usePosts();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllPosts();
      setPosts(data);
    } catch {
      toast.error('فشل تحميل المنشورات');
    } finally {
      setLoading(false);
    }
  }, [getAllPosts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (post: Post) => {
    setEditing(post);
    setForm({
      title: post.title,
      body: post.body || '',
      image_url: post.image_url || '',
      type: (post.type as PostType) || 'general',
      is_published: post.is_published,
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
      toast.error('الرجاء إدخال عنوان المنشور');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updatePost(editing.id, {
          title: form.title.trim(),
          body: form.body.trim() || null,
          image_url: form.image_url.trim() || null,
          type: form.type,
          is_published: form.is_published,
        });
        toast.success('تم تحديث المنشور بنجاح');
      } else {
        await createPost({
          title: form.title.trim(),
          body: form.body.trim() || null,
          image_url: form.image_url.trim() || null,
          type: form.type,
          is_published: form.is_published,
          order_index: 0,
        });
        toast.success('تم نشر المنشور بنجاح');
      }
      closeForm();
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`هل أنت متأكد من حذف منشور "${post.title}"؟`)) return;
    setDeletingId(post.id);
    try {
      await deletePost(post.id);
      toast.success('تم حذف المنشور');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (post: Post) => {
    try {
      await updatePost(post.id, { is_published: !post.is_published });
      toast.success(post.is_published ? 'تم إخفاء المنشور' : 'تم نشر المنشور');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل التحديث');
    }
  };

  const movePost = async (post: Post, dir: -1 | 1) => {
    const newIndex = (post.order_index || 0) + dir;
    try {
      await updatePost(post.id, { order_index: Math.max(0, newIndex) });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'فشل الترتيب');
    }
  };

  const getTypeMeta = (t: string) =>
    POST_TYPES.find((p) => p.value === t) || POST_TYPES[3];

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">المنشورات</h1>
          <p className="text-gray-600 mt-1">إدارة منشورات المركز التي تظهر للمرضى داخل التطبيق</p>
        </div>
        <button onClick={openNew} className="btn-primary whitespace-nowrap">
          <Plus className="w-5 h-5" />
          منشور جديد
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center py-16">
          <Megaphone className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">لا توجد منشورات بعد</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">ابدأ بنشر أول منشور لمرضاك</p>
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-5 h-5" />
            إنشاء منشور
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post, idx) => {
            const meta = getTypeMeta(post.type || 'general');
            const Icon = meta.icon;
            return (
              <div key={post.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4">
                  {post.image_url ? (
                    <div className="sm:w-48 h-32 sm:h-auto rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="sm:w-48 h-32 sm:h-auto rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium',
                              meta.color
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          {!post.is_published && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                              <EyeOff className="w-3 h-3" />
                              مخفي
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                      </div>
                    </div>

                    {post.body && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.body}</p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('ar', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePost(post, -1)}
                          disabled={idx === 0}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                          title="رفع"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => movePost(post, 1)}
                          disabled={idx === posts.length - 1}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                          title="إنزال"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => togglePublish(post)}
                          className={cn(
                            'p-2 rounded-lg hover:bg-gray-100',
                            post.is_published ? 'text-green-600' : 'text-gray-400'
                          )}
                          title={post.is_published ? 'إخفاء' : 'نشر'}
                        >
                          {post.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(post)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-primary-600"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={closeForm}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {editing ? 'تعديل المنشور' : 'منشور جديد'}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto scrollbar-thin space-y-5">
              <div>
                <label className="label">نوع المنشور</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POST_TYPES.map((t) => {
                    const TI = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                        className={cn(
                          'flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-medium transition-all text-sm',
                          form.type === t.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        <TI className="w-5 h-5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">العنوان *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: خصم 20% على تنظيف الأسنان"
                />
              </div>

              <div>
                <label className="label">النص المرفق</label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="اكتب تفاصيل المنشور أو العرض..."
                />
              </div>

              <div>
                <label className="label">رابط الصورة</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    dir="ltr"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                {form.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
                    <img
                      src={form.image_url}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  </div>
                )}
                {!form.image_url && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    اتركه فارغًا لمنشور نصي فقط
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">حالة النشر</p>
                  <p className="text-xs text-gray-500">
                    {form.is_published ? 'سيظهر المنشور للمرضى فور الحفظ' : 'سيبقى المنشور مخفيًا حتى تنشره'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_published: !f.is_published }))}
                  className={cn(
                    'relative w-14 h-7 rounded-full transition-colors',
                    form.is_published ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                      form.is_published ? 'translate-x-0.5' : 'translate-x-7'
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
                      {editing ? 'حفظ التغييرات' : 'نشر المنشور'}
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
