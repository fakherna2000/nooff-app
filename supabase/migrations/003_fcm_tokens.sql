-- جدول تخزين توكنات Firebase Cloud Messaging (FCM) لإشعارات تطبيق الأندرويد
create table if not exists public.fcm_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    patient_id uuid references public.patients(id) on delete cascade,
    token text not null,
    device_type text default 'android',
    created_at timestamptz not null default now(),
    unique(token)
);

alter table public.fcm_tokens enable row level security;

drop policy if exists "user can manage own fcm tokens" on public.fcm_tokens;
create policy "user can manage own fcm tokens"
    on public.fcm_tokens for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

grant select, insert, update, delete on public.fcm_tokens to authenticated;
