-- ربط الموعد بالطبيب المختار من المريض
alter table public.appointments
  add column if not exists doctor_id uuid references public.clinic_doctors(id) on delete set null;

create index if not exists idx_appointments_doctor_id on public.appointments(doctor_id);
