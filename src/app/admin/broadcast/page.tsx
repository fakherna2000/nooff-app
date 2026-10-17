'use client';

import { useState } from 'react';
import { Send, Megaphone, Tag, Lightbulb, FileText, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'offer', label: 'عرض خاص / خصم', icon: Tag, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'ad', label: 'إعلان', icon: Megaphone, color: 'text-primary-600 bg-primary-50 border-primary-200' },
  { value: 'tip', label: 'نصيحة طبية', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'general', label: 'عام', icon: FileText, color: 'text-accent-600 bg-accent-50 border-accent-200' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

export default function BroadcastNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);

  const canSend = title.trim() && body.trim() && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          data: { category },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      setResult({ sent: data.sent, total: data.total });
      if (data.sent > 0) {
        toast.success(`تم إرسال الإشعار إلى ${data.sent}/${data.total} جهاز`);
      } else {
        toast.warning('لم يتم إرسال الإشعار لأي جهاز — لا توجد أجهزة مسجلة');
      }
    } catch (e: any) {
      toast.error(e?.message || 'فشل إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-primary-600" />
          إشعارات عامة
        </h1>
        <p className="text-gray-500 mt-1">أرسل إشعاراً لجميع المرضى المسجلين في التطبيق</p>
      </div>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان الإشعار
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: خصم 20% على التنظيف"
            className="input"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نص الرسالة
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب محتوى الإشعار هنا..."
            className="input min-h-[140px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">{body.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التصنيف
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all',
                    active
                      ? cat.color + ' border-current shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {result && (
          <div
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border',
              result.sent > 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            )}
          >
            {result.sent > 0 ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <p className="font-medium">
                تم الإرسال إلى {result.sent} من أصل {result.total} جهاز
              </p>
              {result.total - result.sent > 0 && (
                <p className="text-sm opacity-80">
                  {result.total - result.sent} جهاز فشل الاستلام (قد تكون التوكنات غير صالحة)
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              إرسال إلى جميع المرضى
            </>
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 text-sm">
        <Users className="w-5 h-5 flex-shrink-0" />
        <p>
          سيتم إرسال هذا الإشعار إلى جميع أجهزة المرضى المسجلة في التطبيق.
          تأكد من مراجعة المحتوى قبل الإرسال.
        </p>
      </div>
    </div>
  );
}
