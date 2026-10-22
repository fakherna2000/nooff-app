-- =====================================================================
-- أطباء العيادة - Clinic Doctors
-- =====================================================================

create table if not exists public.clinic_doctors (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    specialty text,
    bio text,
    image_url text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_doctors_active
    on public.clinic_doctors(is_active, sort_order);

-- ---------------------------------------------------------------------
-- تحديث updated_at تلقائياً
-- ---------------------------------------------------------------------
drop trigger if exists set_clinic_doctors_updated_at on public.clinic_doctors;
create trigger set_clinic_doctors_updated_at
    before update on public.clinic_doctors
    for each row execute function public.set_updated_at();

-- =====================================================================
-- سياسات الأمان (RLS)
-- =====================================================================
alter table public.clinic_doctors enable row level security;

drop policy if exists "read active doctors" on public.clinic_doctors;
create policy "read active doctors"
    on public.clinic_doctors for select
    using (is_active = true);

drop policy if exists "admin manage doctors" on public.clinic_doctors;
create policy "admin manage doctors"
    on public.clinic_doctors for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- =====================================================================
-- بيانات افتراضية - تُضاف مرة واحدة فقط
-- =====================================================================
insert into public.clinic_doctors (name, specialty, bio, sort_order)
select * from (values
    ('د. خالد النوفل', 'أخصائي تقويم وتجميل الأسنان', 'خبرة واسعة في خطط التقويم الشفاف وتصميم الابتسامة، مع متابعة دقيقة لحالة المريض خطوة بخطوة.', 1),
    ('د. سمر العبد', 'طبيبة أسنان عامة', 'تركّز على العلاجات الوقائية والحشوات التجميلية وتنظيف الأسنان بأسلوب هادئ يراعي راحة المريض.', 2),
    ('د. ريم الحسن', 'أخصائية تجميل غير جراحي', 'متخصصة في العناية بالبشرة والفيلر والبوتكس بخطط مخصصة للحصول على نتيجة طبيعية ومتوازنة.', 3)
) as seed(name, specialty, bio, sort_order)
where not exists (select 1 from public.clinic_doctors);
