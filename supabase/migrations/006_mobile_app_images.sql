alter table public.clinic_settings
    add column if not exists mobile_images jsonb not null default '{}'::jsonb;

update public.clinic_settings
set mobile_images = coalesce(mobile_images, '{}'::jsonb)
where mobile_images is null;
