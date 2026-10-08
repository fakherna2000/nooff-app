'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Phone,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  UserMinus,
} from 'lucide-react';
import { useAppointments, usePatients } from '@/hooks/useData';
import type { Appointment, Patient } from '@/lib/database.types';
import {
  formatDate,
  formatTime,
  getStatusClass,
  getStatusLabel,
  generateArabicInitials,
  getInitialsColor,
  cn,
} from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAppointmentsPage() {
  const { getAllAppointments, updateAppointment, deleteAppointment, createAppointment } = useAppointments();
  const { getAllPatients } = usePatients();
  const [appointments, setAppointments] = useState<
    (Appointment & { patients?: { full_name: string; phone: string } })[]
  >([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [showModal, setShowModal] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const refresh = () => load();

  async function load() {
    setLoading(true);
    try {
      const [apps, pts] = await Promise.all([getAllAppointments(), getAllPatients()]);
      setAppointments(apps as any);
      setPatients(pts as Patient[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filterFn = (a: any) => {
    if (filter === 'all') return true;
    return a.status === filter;
  };

  const sortedApps = appointments
    .filter(filterFn)
    .sort(
      (a, b) =>
        new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() -
        new Date(`${b.appointment_date}T${b.appointment_time}`).getTime()
    );

  const weekStart = new Date(viewDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayApps = (date: Date) =>
    sortedApps.filter((a) => a.appointment_date === date.toISOString().split('T')[0]);

  const stats = {
    scheduled: appointments.filter((a) => a.status === 'scheduled').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">المواعيد</h1>
          <p className="text-gray-600 mt-1">جدولة ومتابعة جميع المواعيد</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          موعد جديد
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">مجدول</p>
            <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">مكتمل</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">ملغي</p>
            <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto scrollbar-thin">
        {(
          [
            ['all', 'الكل'],
            ['scheduled', 'مجدول'],
            ['completed', 'مكتمل'],
            ['cancelled', 'ملغي'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              filter === key ? 'bg-white shadow text-primary-700' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(viewDate);
                d.setDate(d.getDate() - 7);
                setViewDate(d);
              }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-gray-900">
              أسبوع {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </h2>
            <button
              onClick={() => {
                const d = new Date(viewDate);
                d.setDate(d.getDate() + 7);
                setViewDate(d);
              }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="btn-secondary !py-1.5 text-xs mr-2"
            >
              اليوم
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayApps = todayApps(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className="rounded-xl border border-gray-100 overflow-hidden">
                <div
                  className={cn(
                    'p-3 text-center',
                    isToday ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-700'
                  )}
                >
                  <p className="text-xs font-medium">
                    {day.toLocaleDateString('ar-SA', { weekday: 'long' })}
                  </p>
                  <p className="text-xl font-bold">{day.getDate()}</p>
                </div>
                <div className="p-2 space-y-2 min-h-[150px] max-h-[400px] overflow-y-auto scrollbar-thin">
                  {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))
                    : dayApps.length === 0
                    ? (
                      <div className="text-center py-8 text-xs text-gray-400">
                        لا مواعيد
                      </div>
                    )
                    : dayApps.map((appt) => (
                        <div
                          key={appt.id}
                          className={cn(
                            'p-2.5 rounded-lg border text-xs',
                            appt.status === 'scheduled' && 'bg-blue-50 border-blue-100',
                            appt.status === 'completed' && 'bg-green-50 border-green-100',
                            appt.status === 'cancelled' && 'bg-red-50 border-red-100 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900">{formatTime(appt.appointment_time)}</span>
                            <span className="text-[10px] text-gray-500">{appt.duration_minutes}د</span>
                          </div>
                          <p className="font-semibold text-gray-800 truncate">
                            {(appt as any).patients?.full_name || 'مريض'}
                          </p>
                          <p className="text-gray-600 truncate">{appt.type}</p>
                          <div className="mt-2 flex gap-1">
                            <select
                              defaultValue={appt.status}
                              onChange={async (e) => {
                                await updateAppointment(appt.id, { status: e.target.value as any });
                                toast.success('تم تحديث الحالة');
                                refresh();
                              }}
                              className="!py-1 !px-1.5 !text-[10px] input w-full bg-white"
                            >
                              <option value="scheduled">مجدول</option>
                              <option value="completed">مكتمل</option>
                              <option value="cancelled">ملغي</option>
                              <option value="no_show">لم يحضر</option>
                            </select>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 text-lg mb-5">القائمة الكاملة</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedApps.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-lg">لا توجد مواعيد</p>
            <p className="text-sm mt-1">ابدأ بحجز أول موعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 -m-6">
            {sortedApps.map((appt) => {
              const patient = patients.find((p) => p.id === appt.patient_id);
              const full_name = (appt as any).patients?.full_name || patient?.full_name || 'مريض';
              const phone = (appt as any).patients?.phone || patient?.phone || '';
              return (
                <div key={appt.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/70">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${getInitialsColor(
                      full_name
                    )}`}
                  >
                    {generateArabicInitials(full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/patients/${appt.patient_id}`}
                        className="font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors"
                      >
                        {full_name}
                      </Link>
                      <span className={getStatusClass(appt.status)}>{getStatusLabel(appt.status)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(appt.appointment_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(appt.appointment_time)} ({appt.duration_minutes}د)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {appt.type}
                      </span>
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/patients/${appt.patient_id}?tab=appointments`}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <User className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
                        await deleteAppointment(appt.id);
                        toast.success('تم حذف الموعد');
                        refresh();
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <NewAppointmentModal
          patients={patients}
          onClose={() => setShowModal(false)}
          onSave={async (patientId, date, time, duration, type, notes) => {
            await createAppointment({
              patient_id: patientId,
              appointment_date: date,
              appointment_time: time,
              duration_minutes: duration,
              type,
              notes: notes || null,
              status: 'scheduled',
            });
            toast.success('تم حجز الموعد');
            setShowModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function NewAppointmentModal({
  patients,
  onClose,
  onSave,
}: {
  patients: Patient[];
  onClose: () => void;
  onSave: (
    patientId: string,
    date: string,
    time: string,
    duration: number,
    type: string,
    notes?: string
  ) => Promise<void>;
}) {
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [time, setTime] = useState('17:00');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('فحص');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const types = ['فحص', 'تنظيف', 'حشو', 'خلع', 'تقويم', 'زراعة', 'تركيب', 'متابعة'];

  const filteredPatients = patients.filter(
    (p) => p.full_name.includes(patientSearch) || p.phone.includes(patientSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">حجز موعد جديد</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto scrollbar-thin">
          <div>
            <label className="label">المريض</label>
            <input
              className="input mb-2"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto scrollbar-thin border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filteredPatients.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">لا يوجد مرضى مطابقين</p>
              ) : (
                filteredPatients.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatientId(p.id);
                      setPatientSearch('');
                    }}
                    className={cn(
                      'w-full p-3 flex items-center gap-3 text-right hover:bg-gray-50 transition-colors',
                      patientId === p.id && 'bg-primary-50'
                    )}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${getInitialsColor(
                        p.full_name
                      )}`}
                    >
                      {generateArabicInitials(p.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.phone}</p>
                    </div>
                    {patientId === p.id && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="label">نوع الزيارة</label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'px-4 py-2 rounded-xl border-2 text-sm font-medium',
                    type === t
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">التاريخ</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">الوقت</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">المدة (دقيقة)</label>
            <div className="flex gap-2">
              {[15, 30, 45, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 font-medium text-sm',
                    duration === d
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600'
                  )}
                >
                  {d} د
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">ملاحظات</label>
            <textarea
              className="input min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اختياري..."
            />
          </div>

          <button
            className="btn-primary w-full"
            disabled={!patientId || saving}
            onClick={async () => {
              setSaving(true);
              await onSave(patientId, date, time, duration, type, notes);
              setSaving(false);
            }}
          >
            {saving ? (
              <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>
                <Calendar className="w-5 h-5" /> تأكيد الحجز
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
