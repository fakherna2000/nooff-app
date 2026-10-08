'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/useData';
import type { PatientWithAllRelations } from '@/lib/offline-db';
import type { Appointment } from '@/lib/database.types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserMinus,
  MapPin,
  Bell,
} from 'lucide-react';
import {
  formatDate,
  formatTime,
  getStatusLabel,
  cn,
} from '@/lib/utils';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { getPatientById } = usePatients();
  const [patient, setPatient] = useState<PatientWithAllRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const res = await fetch('/api/patient/me');
      if (res.ok) {
        const data = await res.json();
        if (data.patientId) {
          const p = await getPatientById(data.patientId);
          setPatient(p);
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (!patient) return null;

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const allApps = [...patient.appointments].sort((a, b) => {
    const d1 = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const d2 = new Date(`${b.appointment_date}T${b.appointment_time}`);
    return d1.getTime() - d2.getTime();
  });

  const filtered = allApps.filter((a) => {
    const isUpcoming = a.status === 'scheduled' && a.appointment_date >= today;
    const isPast = a.status !== 'scheduled' || a.appointment_date < today;
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'past') return isPast;
    return true;
  }).reverse();

  const upcoming = allApps.filter(
    (a) => a.status === 'scheduled' && a.appointment_date >= today
  );
  const next = upcoming[0];

  const statusIcon = (appt: Appointment) => {
    if (appt.status === 'completed') return <CheckCircle2 className="w-5 h-5" />;
    if (appt.status === 'cancelled') return <XCircle className="w-5 h-5" />;
    if (appt.status === 'no_show') return <UserMinus className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };
  const statusColor = (appt: Appointment) => {
    if (appt.status === 'completed') return 'bg-green-100 text-green-700';
    if (appt.status === 'cancelled') return 'bg-red-100 text-red-700';
    if (appt.status === 'no_show') return 'bg-gray-200 text-gray-600';
    return 'bg-primary-100 text-primary-700';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">المواعيد</h1>
        <p className="text-gray-600 mt-1 text-sm">مواعيد زياراتك القادمة والسابقة</p>
      </div>

      {next && (
        <div className="bg-gradient-to-br from-primary-600 to-accent-500 rounded-3xl p-5 text-white shadow-xl overflow-hidden relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <Bell className="w-4 h-4 animate-pulse" />
              <span>الموعد القادم</span>
            </div>
            <p className="text-4xl font-black mb-1">{formatTime(next.appointment_time)}</p>
            <p className="text-lg font-semibold text-white/90">{formatDate(next.appointment_date)}</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">{next.type}</p>
                {next.notes && <p className="text-sm text-white/80 mt-0.5">{next.notes}</p>}
              </div>
            </div>
            {next.duration_minutes && (
              <div className="flex items-center gap-2 mt-3 text-sm text-white/70">
                <Clock className="w-4 h-4" />
                <span>مدة الزيارة: {next.duration_minutes} دقيقة</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-4 text-sm text-white/80 bg-white/10 rounded-xl p-3">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>مركز نوف لطب الأسنان - يرجى الوصول قبل الموعد بعشر دقائق</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-full">
        {(
          [
            ['all', 'الكل'],
            ['upcoming', 'القادمة'],
            ['past', 'السابقة'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              filter === key ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-lg text-gray-700">لا توجد مواعيد</p>
            <p className="text-sm text-gray-500 mt-1">
              {filter === 'upcoming'
                ? 'لا توجد مواعيد قادمة حالياً'
                : filter === 'past'
                ? 'لا توجد مواعيد سابقة'
                : 'سيتم عرض مواعيدك هنا'}
            </p>
          </div>
        ) : (
          filtered.map((appt) => (
            <div
              key={appt.id}
              className={cn(
                'card flex items-center gap-4 transition-all',
                appt.status === 'cancelled' && 'opacity-60'
              )}
            >
              <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col items-center justify-center shrink-0 border border-primary-100">
                <span className="text-[10px] text-gray-500 font-medium">
                  {formatDate(appt.appointment_date).split(' ')[1]}
                </span>
                <span className="text-lg font-black text-gray-900 leading-none">
                  {formatDate(appt.appointment_date).split(' ')[0]}
                </span>
                <span className="text-[11px] font-bold text-primary-600 mt-1">
                  {formatTime(appt.appointment_time)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{appt.type}</h3>
                  <span className={cn('badge text-[10px]', statusColor(appt))}>
                    {getStatusLabel(appt.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(appt.appointment_date)}
                  </span>
                  {appt.duration_minutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.duration_minutes} دقيقة
                    </span>
                  )}
                </div>
                {appt.notes && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">{appt.notes}</p>
                )}
              </div>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', statusColor(appt))}>
                {statusIcon(appt)}
              </div>
            </div>
          ))
        )}
      </div>

      {!next && (
        <div className="card border-blue-200 bg-blue-50/30">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-1.5 text-sm">
            <Calendar className="w-4 h-4" /> جدولة موعد
          </h3>
          <p className="text-sm text-blue-900/80 leading-relaxed">
            يرجى التواصل مع المركز على أرقام الهواتف الرسمية لحجز موعد جديد أو إعادة جدولة موعد موجود.
          </p>
        </div>
      )}
    </div>
  );
}
