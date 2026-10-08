'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  Phone,
  User,
  Calendar,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';
import { usePatients } from '@/hooks/useData';
import type { Patient } from '@/lib/database.types';
import { formatDate, generateArabicInitials, getInitialsColor, formatPhoneNumber } from '@/lib/utils';

export default function AdminPatientsPage() {
  const { searchPatients, getAllPatients } = usePatients();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = debouncedQuery
          ? await searchPatients(debouncedQuery)
          : await getAllPatients();
        setPatients(data as Patient[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">المرضى</h1>
          <p className="text-gray-600 mt-1">إدارة وبيانات جميع مرضى المركز</p>
        </div>
        <Link href="/admin/patients/new" className="btn-primary">
          <UserPlus className="w-4 h-4" />
          إضافة مريض
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              className="input pr-12"
              placeholder="ابحث بالاسم أو رقم الهاتف..."
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
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            فلاتر
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-gray-100 rounded" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
                <div className="w-24 h-8 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-lg">لا يوجد مرضى</p>
            <p className="text-sm mt-1 mb-4">
              {debouncedQuery ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ بإضافة أول مريض للنظام'}
            </p>
            {!debouncedQuery && (
              <Link href="/admin/patients/new" className="btn-primary inline-flex">
                <UserPlus className="w-4 h-4" />
                إضافة مريض جديد
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 -m-6">
            {patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/admin/patients/${patient.id}`}
                className="flex items-center gap-4 p-5 hover:bg-gray-50/70 transition-colors group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${getInitialsColor(
                    patient.full_name
                  )}`}
                >
                  {generateArabicInitials(patient.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {patient.full_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhoneNumber(patient.phone)}
                    </span>
                    {patient.date_of_birth && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(patient.date_of_birth)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
