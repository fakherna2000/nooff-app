-- =====================================================================
-- خدمات العيادة الديناميكية - Clinic Services
-- =====================================================================

create table if not exists public.clinic_services (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    category text not null default 'dental' check (category in ('dental', 'beauty')),
    image_url text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_services_active
    on public.clinic_services(is_active, category, sort_order);

-- ---------------------------------------------------------------------
-- تحديث updated_at تلقائياً
-- ---------------------------------------------------------------------
drop trigger if exists set_clinic_services_updated_at on public.clinic_services;
create trigger set_clinic_services_updated_at
    before update on public.clinic_services
    for each row execute function public.set_updated_at();

-- =====================================================================
-- سياسات الأمان (RLS)
-- =====================================================================
alter table public.clinic_services enable row level security;

-- الكل يقرأ الخدمات المفعّلة
drop policy if exists "read active services" on public.clinic_services;
create policy "read active services"
    on public.clinic_services for select
    using (is_active = true);

-- الأدمن يدير كل الخدمات
drop policy if exists "admin manage services" on public.clinic_services;
create policy "admin manage services"
    on public.clinic_services for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- =====================================================================
-- بيانات افتراضية (الخدمات الحالية) - تُضاف مرة واحدة فقط
-- =====================================================================
insert into public.clinic_services (title, description, category, sort_order)
select * from (values
    ('تبييض الأسنان', 'ابتسامة أكثر إشراقاً', 'dental', 1),
    ('زراعة الأسنان', 'حل دائم آمن للأسنان المفقودة', 'dental', 2),
    ('تقويم الأسنان', 'تصحيح الأسنان لتحسين المظهر الوظيفي', 'dental', 3),
    ('حشوات تجميلية', 'مظهر طبيعي وجميل', 'dental', 4),
    ('تنظيف الأسنان', 'لمعان أكثر ألقاً', 'dental', 5),
    ('عناية بالبشرة', 'نضارة يومية ولمسة أنعم', 'beauty', 1),
    ('فيلر وبوتكس', 'تفاصيل متوازنة وطبيعية', 'beauty', 2),
    ('تقشير كيميائي', 'تجديد وإشراقة للبشرة', 'beauty', 3),
    ('تنظيف البشرة العميق', 'عناية نقية ومنعشة', 'beauty', 4)
) as seed(title, description, category, sort_order)
where not exists (select 1 from public.clinic_services);
