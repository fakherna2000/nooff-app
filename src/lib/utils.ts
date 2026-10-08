import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const period = hour >= 12 ? 'م' : 'ص';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${period}`;
}

export function formatDateTime(date: string | Date, time?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d);
  if (time) {
    return `${dateStr} - ${formatTime(time)}`;
  }
  return dateStr;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'لم تبدأ',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتملة',
    scheduled: 'مجدول',
    cancelled: 'ملغي',
    no_show: 'لم يحضر',
    cash: 'نقدي',
    card: 'بطاقة بنكية',
    bank_transfer: 'تحويل بنكي',
    other: 'أخرى',
    male: 'ذكر',
    female: 'أنثى',
  };
  return labels[status] || status;
}

export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    not_started: 'status-not-started',
    in_progress: 'status-in-progress',
    completed: 'status-completed',
    scheduled: 'badge bg-blue-100 text-blue-700',
    cancelled: 'badge bg-red-100 text-red-700',
    no_show: 'badge bg-gray-100 text-gray-700',
  };
  return classes[status] || 'badge bg-gray-100 text-gray-700';
}

export function calculateTotals(payments: { amount: number }[], totalCost: number) {
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalCost - paid);
  const progress = totalCost > 0 ? Math.min(100, (paid / totalCost) * 100) : 0;
  return { paid, remaining, progress };
}

export function generateArabicInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '؟';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

export function getInitialsColor(name: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-accent-100 text-accent-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.startsWith('0')) {
    return `+966 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
