-- السماح للمرضى بطلب مواعيد جديدة
-- إضافة حالة "مطلوب" (requested) للتمييز عن المواعيد المؤكدة من قبل الإدارة
alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('scheduled', 'completed', 'cancelled', 'no_show', 'requested'));

alter table public.appointments
  alter column status set default 'requested';

-- سياسة السماح للمريض بإدراج مواعيده الخاصة
drop policy if exists "patient can insert own appointments" on public.appointments;
create policy "patient can insert own appointments"
    on public.appointments for insert
    with check (
        exists (
            select 1 from public.patients p
            where p.id = patient_id
            and p.user_id = auth.uid()
        )
    );

-- السماح للمريض بتحديث حالة موعده إلى cancelled فقط (إلغاء)
drop policy if exists "patient can cancel own appointments" on public.appointments;
create policy "patient can cancel own appointments"
    on public.appointments for update
    using (
        exists (
            select 1 from public.patients p
            where p.id = patient_id
            and p.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.patients p
            where p.id = patient_id
            and p.user_id = auth.uid()
        )
        and status in ('cancelled', 'requested', 'scheduled')
    );
