-- =====================================================================
-- Migration 002: إضافة نوع العلاج والتشخيص للمرضى + جدول المنشورات
-- =====================================================================

-- إضافة حقل نوع العلاج للمرضى (orthodontics = تقويم، general = علاجات عامة)
alter table public.patients
    add column if not exists treatment_type text not null default 'general'
    check (treatment_type in ('orthodontics', 'general'));

-- إضافة حقل تشخيص الطبيب (يظهر للمريض عند عدم وجود خطة تقويم)
alter table public.patients
    add column if not exists diagnosis text;

-- =====================================================================
-- جدول منشورات المركز (إعلانات، عروض، نصائح)
-- =====================================================================
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text,
    image_url text,
    type text not null default 'general'
        check (type in ('offer', 'ad', 'tip', 'general')),
    is_published boolean not null default true,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- فهارس
create index if not exists idx_posts_published on public.posts(is_published);
create index if not exists idx_posts_created on public.posts(created_at desc);

-- تحديث تلقائي لتاريخ التعديل
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
    before update on public.posts
    for each row execute function public.set_updated_at();

-- سياسات الأمان
alter table public.posts enable row level security;

drop policy if exists "posts are readable by everyone" on public.posts;
create policy "posts are readable by everyone"
    on public.posts for select
    using (is_published = true or is_admin(auth.uid()));

drop policy if exists "admin can manage posts" on public.posts;
create policy "admin can manage posts"
    on public.posts for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- منح الصلاحيات
grant select on public.posts to authenticated, anon;
grant insert, update, delete on public.posts to authenticated;
