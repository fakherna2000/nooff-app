-- =====================================================================
-- نصوص واجهة تطبيق المريض القابلة للتعديل من لوحة التحكم
-- Editable patient app UI texts
-- =====================================================================

alter table public.clinic_settings
    add column if not exists ui_texts jsonb not null default '{}'::jsonb;

update public.clinic_settings
set ui_texts = '{}'::jsonb
where ui_texts is null;
