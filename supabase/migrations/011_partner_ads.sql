-- =====================================================================
-- شركاؤنا - Partner Ads
-- =====================================================================

create table if not exists public.partner_ads (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    category text not null default 'other'
        check (category in ('restaurant', 'pharmacy', 'lab', 'store', 'other')),
    image_url text,
    cta_label text,
    target_url text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_partner_ads_active
    on public.partner_ads(is_active, category, sort_order);

drop trigger if exists set_partner_ads_updated_at on public.partner_ads;
create trigger set_partner_ads_updated_at
    before update on public.partner_ads
    for each row execute function public.set_updated_at();

alter table public.partner_ads enable row level security;

drop policy if exists "read active partner ads" on public.partner_ads;
create policy "read active partner ads"
    on public.partner_ads for select
    using (is_active = true);

drop policy if exists "admin manage partner ads" on public.partner_ads;
create policy "admin manage partner ads"
    on public.partner_ads for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

grant select on public.partner_ads to authenticated, anon;
grant insert, update, delete on public.partner_ads to authenticated;

insert into public.partner_ads (
    title,
    description,
    category,
    cta_label,
    target_url,
    sort_order
)
select * from (
    values
        ('صيدلية نوف', 'خصومات خاصة على الفيتامينات والعناية اليومية لمرضى المركز.', 'pharmacy', 'اطلب الآن', null, 1),
        ('مطعم صحي', 'وجبات صحية وخيارات مناسبة بعد الجلسات مع عرض خاص لمرضى المركز.', 'restaurant', 'شاهد العرض', null, 2),
        ('مختبر الشفاء', 'تحاليل طبية أساسية بسرعة ودقة مع معاملة خاصة لعملاء المركز.', 'lab', 'عرض التفاصيل', null, 3)
) as seed(title, description, category, cta_label, target_url, sort_order)
where not exists (select 1 from public.partner_ads);
