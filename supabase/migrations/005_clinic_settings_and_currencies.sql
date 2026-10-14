-- =====================================================================
-- إعدادات المنشأة والعملات
-- Clinic Settings & Currencies
-- =====================================================================

-- جدول العملات
create table if not exists public.currencies (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    symbol text not null,
    exchange_rate numeric(12,4) not null default 1,
    is_default boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

-- جدول إعدادات المنشأة (صف واحد فقط)
create table if not exists public.clinic_settings (
    id uuid primary key default gen_random_uuid(),
    clinic_name text not null default 'مركز نوف لطب الأسنان',
    address text,
    phone text,
    email text,
    logo_url text,
    currency_id uuid references public.currencies(id) on delete set null,
    updated_at timestamptz not null default now()
);

-- إضافة حقل العملة للدفعات
alter table public.payments
    add column if not exists currency_id uuid references public.currencies(id) on delete set null;

-- تفعيل RLS
alter table public.currencies enable row level security;
alter table public.clinic_settings enable row level security;

-- سياسات العملات: قراءة للجميع، تعديل للإدارة فقط
drop policy if exists "currencies read" on public.currencies;
create policy "currencies read" on public.currencies
    for select using (true);

drop policy if exists "currencies admin modify" on public.currencies;
create policy "currencies admin modify" on public.currencies
    for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- سياسات إعدادات المنشأة: قراءة للجميع، تعديل للإدارة فقط
drop policy if exists "clinic_settings read" on public.clinic_settings;
create policy "clinic_settings read" on public.clinic_settings
    for select using (true);

drop policy if exists "clinic_settings admin modify" on public.clinic_settings;
create policy "clinic_settings admin modify" on public.clinic_settings
    for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- إدراج العملات الافتراضية
insert into public.currencies (code, name, symbol, exchange_rate, is_default, is_active) values
    ('SAR', 'ريال سعودي', 'ر.س', 1, true, true),
    ('USD', 'دولار أمريكي', '$', 0.2667, false, true),
    ('EUR', 'يورو', '€', 0.244, false, true),
    ('SYP', 'ليرة سورية', 'ل.س', 3750, false, true)
on conflict (code) do nothing;

-- إدراج صف إعدادات افتراضي للمنشأة
insert into public.clinic_settings (clinic_name, address, phone, email)
select 'مركز نوف لطب الأسنان', 'الرياض، المملكة العربية السعودية', '+966500000000', 'info@noof.com'
where not exists (select 1 from public.clinic_settings);

-- تحديث currency_id في الإعدادات إلى العملة الافتراضية (SAR)
update public.clinic_settings
set currency_id = (select id from public.currencies where code = 'SAR' limit 1)
where currency_id is null;
