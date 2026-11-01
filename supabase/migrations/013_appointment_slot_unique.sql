-- منع حجز موعدين بنفس التاريخ والوقت لنفس الطبيب
-- (يُستثنى الطبيب غير المحدد والمواعيد الملغاة)
create unique index if not exists uniq_appointment_doctor_slot
  on public.appointments (doctor_id, appointment_date, appointment_time)
  where doctor_id is not null and status <> 'cancelled';
