'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Clock,
  UserPlus,
  Phone,
} from 'lucide-react';
import { useAppointments, usePatients } from '@/hooks/useData';
import { formatCurrency, formatDate, formatTime, getStatusClass, getStatusLabel } from '@/lib/utils';
import type { Appointment } from '@/lib/database.types';

interface DashboardStats {
  totalPatients?: number;
  todayAppointments?: number;
  upcomingAppointments?: number;
  monthlyRevenue?: number;
}

export default function AdminDashboardPage() {
  const { getDashboardStats, getAllAppointments } = useAppointments();
  const { getAllPatients } = usePatients();
  const [stats, setStats] = useState<DashboardStats>({});
  const [todayAppointments, setTodayAppointments] = useState<
    (Appointment & { patients: { full_name: string; phone: string } })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, appsData] = await Promise.all([
          getDashboardStats(),
          getAllAppointments(),
        ]);
        setStats(statsData);

        const today = new Date().toISOString().split('T')[0];
        const todayApps = (appsData as any[])
          .filter((a) => a.appointment_date === today)
          .slice(0, 5);
        setTodayAppointments(todayApps);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    {
      label: 'إجمالي المرضى',
      value: stats.totalPatients ?? 0,
      icon: Users,
      color: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-50',
      iconBg: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'مواعيد اليوم',
      value: stats.todayAppointments ?? 0,
      icon: Calendar,
      color: 'from-accent-500 to-accent-600',
      bg: 'bg-accent-50',
      iconBg: 'bg-accent-100 text-accent-600',
    },
    {
      label: 'المواعيد القادمة',
      value: stats.upcomingAppointments ?? 0,
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'إيرادات الشهر',
      value: formatCurrency(stats.monthlyRevenue ?? 0),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">مرحباً بك 👋</h1>
          <p className="text-gray-600 mt-1">نظرة سريعة على مركز نوف اليوم</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/patients/new" className="btn-primary">
            <UserPlus className="w-4 h-4" />
            مريض جديد
          </Link>
          <Link href="/admin/appointments/new" className="btn-secondary">
            <Calendar className="w-4 h-4" />
            موعد جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-gray-100 mb-4" />
                <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-8 w-16 bg-gray-100 rounded" />
              </div>
            ))
          : statCards.map((s, i) => (
              <div key={i} className="card relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-5 ${s.bg} bg-gradient-to-br ${s.color}`} />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${s.iconBg}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1">{s.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">مواعيد اليوم</h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              عرض الكل
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">لا توجد مواعيد اليوم</p>
              <p className="text-sm mt-1">استمتع بوقت فراغك!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <Link
                  key={appt.id}
                  href={`/admin/appointments`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium">{formatTime(appt.appointment_time)}</span>
                    <span className="text-[10px] text-gray-500">{appt.duration_minutes} د</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{(appt as any).patients?.full_name || 'مريض'}</p>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {(appt as any).patients?.phone || appt.type}
                    </p>
                  </div>
                  <span className={getStatusClass(appt.status)}>
                    {getStatusLabel(appt.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">إجراءات سريعة</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/admin/patients/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">إضافة مريض</p>
                <p className="text-xs text-gray-500">تسجيل مريض جديد في النظام</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
            </Link>

            <Link
              href="/admin/appointments/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-accent-200 hover:bg-accent-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-600 group-hover:bg-accent-100 flex items-center justify-center transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">حجز موعد</p>
                <p className="text-xs text-gray-500">جدولة موعد جديد لمريض</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-accent-500" />
            </Link>

            <Link
              href="/admin/patients"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">عرض المرضى</p>
                <p className="text-xs text-gray-500">قائمة جميع المرضى المسجلين</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">التقارير والإعدادات</p>
                <p className="text-xs text-gray-500">إعدادات النظام والتقارير</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
