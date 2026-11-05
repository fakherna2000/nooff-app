-- إضافة حقل تفاصيل الخدمة (full_content) لجدول clinic_services
alter table public.clinic_services
add column if not exists full_content text;
