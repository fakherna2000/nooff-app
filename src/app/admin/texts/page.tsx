'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Type, Save, Search, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { UI_TEXT_GROUPS, UI_TEXT_DEFAULTS } from '@/lib/ui-texts';
import type { ClinicSettings as ClinicSettingsType, ClinicUiTexts } from '@/lib/database.types';

export default function AdminTextsPage() {
  const [settings, setSettings] = useState<Partial<ClinicSettingsType>>({});
  const [texts, setTexts] = useState<ClinicUiTexts>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.data) {
        setSettings(data.data);
        setTexts((data.data.ui_texts || {}) as ClinicUiTexts);
      } else {
        toast.error(data.error || 'فشل تحميل النصوص');
      }
    } catch {
      toast.error('فشل تحميل النصوص');
    } finally {
      setLoading(false);
    }
  };

  const setText = (key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  };

  const resetText = (key: string) => {
    setTexts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAll = () => {
    if (!confirm('سيتم إرجاع جميع النصوص إلى القيم الافتراضية (لن يُحفظ حتى تضغط حفظ). متابعة؟')) return;
    setTexts({});
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ui_texts: texts }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSettings(data.data);
        setTexts((data.data.ui_texts || {}) as ClinicUiTexts);
        toast.success('تم حفظ نصوص التطبيق');
      } else {
        toast.error(data.error || 'فشل الحفظ');
      }
    } catch {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const term = search.trim().toLowerCase();

  const groups = useMemo(() => {
    return UI_TEXT_GROUPS.filter(
      (group) => activeGroup === 'all' || group.id === activeGroup
    )
      .map((group) => ({
        ...group,
        fields: group.fields.filter(
          (field) =>
            !term ||
            field.label.toLowerCase().includes(term) ||
            field.default.toLowerCase().includes(term) ||
            (texts[field.key] || '').toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.fields.length > 0);
  }, [activeGroup, term, texts]);

  const customizedCount = Object.values(texts).filter(
    (value) => typeof value === 'string' && value.trim() !== ''
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            نصوص التطبيق
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            عدّلي جميع الجمل التي تظهر في تطبيق المريض من هنا
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-500">جاري التحميل...</div>
      ) : (
        <>
          <div className="card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 right-3" />
                <input
                  className="input pr-9"
                  placeholder="ابحث عن جملة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={resetAll} className="btn-secondary" disabled={saving}>
                  <RotateCcw className="w-4 h-4" />
                  إرجاع الكل للافتراضي
                </button>
                <button onClick={save} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ النصوص'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  activeGroup === 'all'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                الكل
              </button>
              {UI_TEXT_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    activeGroup === group.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              عدد النصوص المخصصة: {customizedCount} — أي حقل تتركيه فارغاً سيعود للقيمة الافتراضية.
            </p>
          </div>

          {groups.length === 0 && (
            <div className="card text-center py-10 text-gray-500">لا توجد نتائج مطابقة</div>
          )}

          {groups.map((group) => (
            <div key={group.id} className="card">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 flex items-center gap-2">
                <Type className="w-5 h-5 text-primary-600" />
                {group.label}
              </h2>
              {group.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{group.description}</p>
              )}
              <div className="grid grid-cols-1 gap-4">
                {group.fields.map((field) => {
                  const current = texts[field.key] || '';
                  const isCustom = current.trim() !== '' && current !== field.default;
                  return (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-800/40"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="label mb-0">{field.label}</label>
                        <div className="flex items-center gap-2">
                          {isCustom && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              مخصّص
                            </span>
                          )}
                          {current !== '' && (
                            <button
                              type="button"
                              onClick={() => resetText(field.key)}
                              className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
                              title="إرجاع للافتراضي"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              افتراضي
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        className="input"
                        value={current}
                        placeholder={field.default}
                        onChange={(e) => setText(field.key, e.target.value)}
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                        الافتراضي: {field.default}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length > 0 && (
            <div className="flex justify-end">
              <button onClick={save} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ النصوص'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
