'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, CheckCheck, Calendar, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppointmentNotification {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  created_at: string;
}

const STORAGE_KEY = 'noof_admin_last_seen_appointments';

function playNotificationSound() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playBeep = (start: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playBeep(now, 880, 0.18);
    playBeep(now + 0.22, 1175, 0.22);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // ignore audio errors
  }
}

function showBrowserNotification(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.svg' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      });
    }
  } catch {
    // ignore
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const loadNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `id, patient_id, appointment_date, appointment_time, type, created_at, patients (full_name)`,
      )
      .eq('status', 'requested')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return;

    const mapped: AppointmentNotification[] = (data || []).map((a: any) => ({
      id: a.id,
      patient_id: a.patient_id,
      patient_name: a.patients?.full_name || 'مريض',
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      type: a.type,
      created_at: a.created_at,
    }));

    if (!initializedRef.current) {
      // تحميل أولي: اعتبر كل شيء مقروءاً لعدم إزعاج المستخدم بالإشعارات القديمة
      mapped.forEach((n) => seenIdsRef.current.add(n.id));
      initializedRef.current = true;
    }

    setNotifications(mapped);

    const unread = mapped.filter((n) => !seenIdsRef.current.has(n.id)).length;
    setUnreadCount(unread);

    // إشعار للمواعيد الجديدة غير المقروءة
    const newOnes = mapped.filter((n) => !seenIdsRef.current.has(n.id));
    if (newOnes.length > 0) {
      newOnes.forEach((n) => seenIdsRef.current.add(n.id));
      playNotificationSound();
      const first = newOnes[0];
      showBrowserNotification(
        'طلب موعد جديد',
        `${first.patient_name} — ${formatDate(first.appointment_date)} ${first.appointment_time}`,
      );
      const extra = newOnes.length - 1;
      toast.info(
        extra > 0
          ? `طلب موعد جديد من ${first.patient_name} و ${extra} آخرين`
          : `طلب موعد جديد من ${first.patient_name}`,
      );
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAllRead = () => {
    notifications.forEach((n) => seenIdsRef.current.add(n.id));
    setUnreadCount(0);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(seenIdsRef.current)),
      );
    } catch {
      // ignore
    }
  };

  const toggleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      // عند فتح اللوحة، اعتبرها مقروءة
      setTimeout(markAllRead, 500);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                <span className="font-bold text-gray-900">الإشعارات</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="تمييز الكل كمقروء"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  لا توجد إشعارات حالياً
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        'px-4 py-3 hover:bg-gray-50 transition-colors',
                        !seenIdsRef.current.has(n.id) && 'bg-blue-50/40',
                      )}
                    >
                      <a
                        href={`/admin/appointments`}
                        className="block"
                        onClick={() => setOpen(false)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              طلب موعد جديد
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {n.patient_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(n.appointment_date)} • الساعة{' '}
                              {n.appointment_time} • {n.type}
                            </p>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
