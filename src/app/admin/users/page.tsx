'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  UserPlus,
  Mail,
  Shield,
  User,
  Trash2,
  KeyRound,
  Pencil,
  X,
  Ban,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  is_patient: boolean;
  patient_id: string | null;
}

interface UserForm {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'patient';
}

const emptyForm: UserForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'patient',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.data) setUsers(data.data);
      else toast.error(data.error || 'فشل تحميل المستخدمين');
    } catch {
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );

  function openAddModal() {
    setForm(emptyForm);
    setEditingUser(null);
    setShowAddModal(true);
  }

  function openEditModal(u: AdminUser) {
    setEditingUser(u);
    setForm({
      full_name: u.full_name,
      email: u.email,
      password: '',
      role: (u.role as 'admin' | 'patient') || 'patient',
    });
    setShowAddModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            role: form.role,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('تم تحديث المستخدم');
          setShowAddModal(false);
          loadUsers();
        } else {
          toast.error(data.error || 'فشل التحديث');
        }
      } else {
        if (!form.password) {
          toast.error('كلمة المرور مطلوبة عند الإضافة');
          setSaving(false);
          return;
        }
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('تمت إضافة المستخدم');
          setShowAddModal(false);
          loadUsers();
        } else {
          toast.error(data.error || 'فشل الإضافة');
        }
      }
    } catch {
      toast.error('خطأ في الشبكة');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تمت إعادة تعيين كلمة المرور');
        setResetTarget(null);
        setNewPassword('');
      } else {
        toast.error(data.error || 'فشل العملية');
      }
    } catch {
      toast.error('خطأ في الشبكة');
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم حذف المستخدم');
        setDeleteTarget(null);
        loadUsers();
      } else {
        toast.error(data.error || 'فشل الحذف');
      }
    } catch {
      toast.error('خطأ في الشبكة');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-gray-600 mt-1">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          إضافة مستخدم
        </button>
      </div>

      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input pr-12"
            placeholder="ابحث بالاسم أو البريد..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">لا يوجد مستخدمون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 pr-2 font-medium">الاسم</th>
                  <th className="pb-3 px-2 font-medium">البريد</th>
                  <th className="pb-3 px-2 font-medium">الدور</th>
                  <th className="pb-3 px-2 font-medium">آخر دخول</th>
                  <th className="pb-3 pl-2 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-semibold text-sm shrink-0">
                          {u.full_name?.[0] || 'م'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                          {u.phone && (
                            <p className="text-xs text-gray-400 truncate">{u.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            أدمن
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" />
                            مريض
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-500">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString('ar')
                        : '—'}
                    </td>
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetTarget(u);
                            setNewPassword('');
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نموذج إضافة/تعديل المستخدم */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="6 أحرف على الأقل"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  الدور
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'admin' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      form.role === 'admin'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    أدمن
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'patient' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      form.role === 'patient'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    مريض
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editingUser ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* إعادة تعيين كلمة المرور */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">إعادة تعيين كلمة المرور</h2>
              <button
                onClick={() => setResetTarget(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                إعادة تعيين كلمة المرور لـ: <span className="font-semibold">{resetTarget.full_name}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="text"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setResetTarget(null)}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleResetPassword}
                  className="btn-primary flex-1"
                  disabled={resetting || newPassword.length < 6}
                >
                  {resetting ? 'جاري الحفظ...' : 'تأكيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">تأكيد الحذف</h2>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{deleteTarget.full_name}</p>
                  <p className="text-sm text-gray-500">{deleteTarget.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                سيتم حذف حساب هذا المستخدم نهائياً. هل أنت متأكد؟
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-secondary flex-1"
                >
                  <Check className="w-4 h-4" />
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'جاري الحذف...' : 'حذف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
