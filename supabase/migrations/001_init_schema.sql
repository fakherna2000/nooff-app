-- =====================================================================
-- مخطط قاعدة بيانات مركز نوف لطب الأسنان
-- Noof Dental Clinic Database Schema
-- =====================================================================

-- تمكين الإضافات المطلوبة
create extension if not exists "pgcrypto";

-- =====================================================================
-- جدول المرضى
-- =====================================================================
create table if not exists public.patients (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    phone text not null,
    email text,
    date_of_birth date,
    gender text check (gender in ('male', 'female')),
    address text,
    medical_history text,
    notes text,
    user_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- جدول خطط العلاج
-- =====================================================================
create table if not exists public.treatment_plans (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    title text not null,
    description text,
    total_cost numeric(12,2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- جدول مراحل العلاج
-- =====================================================================
create table if not exists public.treatment_stages (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.treatment_plans(id) on delete cascade,
    name text not null,
    description text,
    status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
    is_current boolean not null default false,
    order_index integer not null default 0,
    cost numeric(12,2),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- جدول الدفعات
-- =====================================================================
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    plan_id uuid references public.treatment_plans(id) on delete set null,
    amount numeric(12,2) not null check (amount > 0),
    payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'bank_transfer', 'other')),
    notes text,
    payment_date date not null default current_date,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- جدول المواعيد
-- =====================================================================
create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    appointment_date date not null,
    appointment_time time not null,
    duration_minutes integer not null default 30,
    type text not null default 'فحص',
    notes text,
    status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- جدول اشتراكات الإشعارات الفورية
-- =====================================================================
create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    patient_id uuid references public.patients(id) on delete cascade,
    endpoint text not null,
    keys_p256dh text not null,
    keys_auth text not null,
    user_agent text,
    created_at timestamptz not null default now(),
    unique(endpoint)
);

-- =====================================================================
-- فهارس البحث
-- =====================================================================
create index if not exists idx_patients_full_name on public.patients using gin (to_tsvector('arabic', full_name));
create index if not exists idx_patients_phone on public.patients(phone);
create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_treatment_plans_patient_id on public.treatment_plans(patient_id);
create index if not exists idx_treatment_stages_plan_id on public.treatment_stages(plan_id);
create index if not exists idx_payments_patient_id on public.payments(patient_id);
create index if not exists idx_payments_payment_date on public.payments(payment_date);
create index if not exists idx_appointments_patient_id on public.appointments(patient_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date, appointment_time);
create index if not exists idx_appointments_status on public.appointments(status);

-- =====================================================================
-- الدوال المحدثة للتواريخ تلقائيًا
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
    before update on public.patients
    for each row execute function public.set_updated_at();

drop trigger if exists set_treatment_plans_updated_at on public.treatment_plans;
create trigger set_treatment_plans_updated_at
    before update on public.treatment_plans
    for each row execute function public.set_updated_at();

drop trigger if exists set_treatment_stages_updated_at on public.treatment_stages;
create trigger set_treatment_stages_updated_at
    before update on public.treatment_stages
    for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
    before update on public.appointments
    for each row execute function public.set_updated_at();

-- =====================================================================
-- سياسات الأمان (RLS)
-- =====================================================================
alter table public.patients enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_stages enable row level security;
alter table public.payments enable row level security;
alter table public.appointments enable row level security;
alter table public.push_subscriptions enable row level security;

-- دور الإدارة
drop policy if exists "admin can read all patients" on public.patients;
create policy "admin can read all patients"
    on public.patients for select
    using (is_admin(auth.uid()));

drop policy if exists "admin can insert patients" on public.patients;
create policy "admin can insert patients"
    on public.patients for insert
    with check (is_admin(auth.uid()));

drop policy if exists "admin can update patients" on public.patients;
create policy "admin can update patients"
    on public.patients for update
    using (is_admin(auth.uid()));

drop policy if exists "admin can delete patients" on public.patients;
create policy "admin can delete patients"
    on public.patients for delete
    using (is_admin(auth.uid()));

-- المريض يقرأ بياناته فقط
drop policy if exists "patient can read own data" on public.patients;
create policy "patient can read own data"
    on public.patients for select
    using (auth.uid() = user_id);

-- خطط العلاج
drop policy if exists "admin can read all plans" on public.treatment_plans;
create policy "admin can read all plans"
    on public.treatment_plans for select
    using (is_admin(auth.uid()));

drop policy if exists "admin can modify all plans" on public.treatment_plans;
create policy "admin can modify all plans"
    on public.treatment_plans for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

drop policy if exists "patient can read own plans" on public.treatment_plans;
create policy "patient can read own plans"
    on public.treatment_plans for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

-- مراحل العلاج
drop policy if exists "admin can read all stages" on public.treatment_stages;
create policy "admin can read all stages"
    on public.treatment_stages for select
    using (is_admin(auth.uid()));

drop policy if exists "admin can modify all stages" on public.treatment_stages;
create policy "admin can modify all stages"
    on public.treatment_stages for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

drop policy if exists "patient can read own stages" on public.treatment_stages;
create policy "patient can read own stages"
    on public.treatment_stages for select
    using (exists (
        select 1 from public.treatment_plans tp
        join public.patients p on p.id = tp.patient_id
        where tp.id = plan_id and p.user_id = auth.uid()
    ));

-- الدفعات
drop policy if exists "admin can read all payments" on public.payments;
create policy "admin can read all payments"
    on public.payments for select
    using (is_admin(auth.uid()));

drop policy if exists "admin can modify all payments" on public.payments;
create policy "admin can modify all payments"
    on public.payments for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

drop policy if exists "patient can read own payments" on public.payments;
create policy "patient can read own payments"
    on public.payments for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

-- المواعيد
drop policy if exists "admin can read all appointments" on public.appointments;
create policy "admin can read all appointments"
    on public.appointments for select
    using (is_admin(auth.uid()));

drop policy if exists "admin can modify all appointments" on public.appointments;
create policy "admin can modify all appointments"
    on public.appointments for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

drop policy if exists "patient can read own appointments" on public.appointments;
create policy "patient can read own appointments"
    on public.appointments for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

-- الاشتراكات
drop policy if exists "user can manage own subscriptions" on public.push_subscriptions;
create policy "user can manage own subscriptions"
    on public.push_subscriptions for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- =====================================================================
-- دالة التحقق من صلاحيات الإدارة
-- =====================================================================
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
    return exists (
        select 1
        from auth.users
        where id = user_id
        and (
            raw_app_meta_data->>'role' = 'admin'
            or raw_user_meta_data->>'role' = 'admin'
        )
    );
end;
$$ language plpgsql security definer stable;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to anon;

-- =====================================================================
-- منح الصلاحيات للمستخدمين المصادق عليهم
-- =====================================================================
grant usage on schema public to authenticated, anon;
grant select on public.patients to authenticated, anon;
grant insert, update, delete on public.patients to authenticated;
grant select on public.treatment_plans to authenticated, anon;
grant insert, update, delete on public.treatment_plans to authenticated;
grant select on public.treatment_stages to authenticated, anon;
grant insert, update, delete on public.treatment_stages to authenticated;
grant select on public.payments to authenticated, anon;
grant insert, update, delete on public.payments to authenticated;
grant select on public.appointments to authenticated, anon;
grant insert, update, delete on public.appointments to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

grant usage, select on all sequences in schema public to authenticated;
