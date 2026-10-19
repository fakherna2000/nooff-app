-- =====================================================================
-- نظام الولاء والنقاط - Loyalty Points System
-- =====================================================================

-- ---------------------------------------------------------------------
-- جدول كتالوج المكافآت
-- ---------------------------------------------------------------------
create table if not exists public.loyalty_rewards (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    points_cost integer not null check (points_cost > 0),
    image_url text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- جدول محافظ نقاط المرضى
-- ---------------------------------------------------------------------
create table if not exists public.loyalty_wallets (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null unique references public.patients(id) on delete cascade,
    points_balance integer not null default 0,
    lifetime_points integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- جدول حركات النقاط (سجل المحفظة)
-- ---------------------------------------------------------------------
create table if not exists public.loyalty_transactions (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    points integer not null,
    type text not null check (type in ('earn', 'redeem', 'adjust', 'reversal')),
    reason text,
    appointment_id uuid references public.appointments(id) on delete set null,
    reward_id uuid references public.loyalty_rewards(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- جدول سجل استبدال المكافآت
-- ---------------------------------------------------------------------
create table if not exists public.loyalty_redemptions (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    reward_id uuid references public.loyalty_rewards(id) on delete set null,
    reward_title text,
    points_spent integer not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'used', 'cancelled')),
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- فهارس
-- ---------------------------------------------------------------------
create index if not exists idx_loyalty_wallets_patient on public.loyalty_wallets(patient_id);
create index if not exists idx_loyalty_tx_patient on public.loyalty_transactions(patient_id, created_at desc);
create index if not exists idx_loyalty_redeem_patient on public.loyalty_redemptions(patient_id, created_at desc);
create index if not exists idx_loyalty_rewards_active on public.loyalty_rewards(is_active, sort_order);

-- منع احتساب نقاط أكثر من مرة لنفس الموعد (حماية من التكرار)
create unique index if not exists uniq_loyalty_earn_per_appointment
    on public.loyalty_transactions(appointment_id)
    where type = 'earn' and appointment_id is not null;

-- ---------------------------------------------------------------------
-- تحديث updated_at تلقائياً
-- ---------------------------------------------------------------------
drop trigger if exists set_loyalty_rewards_updated_at on public.loyalty_rewards;
create trigger set_loyalty_rewards_updated_at
    before update on public.loyalty_rewards
    for each row execute function public.set_updated_at();

drop trigger if exists set_loyalty_wallets_updated_at on public.loyalty_wallets;
create trigger set_loyalty_wallets_updated_at
    before update on public.loyalty_wallets
    for each row execute function public.set_updated_at();

-- =====================================================================
-- الدوال
-- =====================================================================

-- ضبط النقاط (تُستدعى من جهة الإدارة/تأكيد الموعد عبر service_role فقط)
create or replace function public.loyalty_adjust_points(
    p_patient_id uuid,
    p_points integer,
    p_type text default 'adjust',
    p_reason text default null,
    p_appointment_id uuid default null,
    p_reward_id uuid default null
) returns integer as $$
declare
    v_balance integer;
begin
    -- منع احتساب نقاط إضافية لنفس الموعد
    if p_type = 'earn' and p_appointment_id is not null then
        if exists (
            select 1 from public.loyalty_transactions
            where appointment_id = p_appointment_id and type = 'earn'
        ) then
            select points_balance into v_balance
            from public.loyalty_wallets where patient_id = p_patient_id;
            return coalesce(v_balance, 0);
        end if;
    end if;

    insert into public.loyalty_wallets (patient_id, points_balance, lifetime_points)
    values (p_patient_id, 0, 0)
    on conflict (patient_id) do nothing;

    update public.loyalty_wallets
    set points_balance = points_balance + p_points,
        lifetime_points = lifetime_points + greatest(p_points, 0)
    where patient_id = p_patient_id
    returning points_balance into v_balance;

    insert into public.loyalty_transactions (patient_id, points, type, reason, appointment_id, reward_id)
    values (p_patient_id, p_points, p_type, p_reason, p_appointment_id, p_reward_id);

    return v_balance;
end;
$$ language plpgsql security definer;

-- استبدال مكافأة من جهة المريض (يستنتج المريض من الجلسة ويمنع الاستبدال لغيره)
create or replace function public.loyalty_redeem_reward(
    p_reward_id uuid
) returns integer as $$
declare
    v_patient_id uuid;
    v_cost integer;
    v_title text;
    v_balance integer;
begin
    select id into v_patient_id
    from public.patients
    where user_id = auth.uid()
    limit 1;

    if v_patient_id is null then
        raise exception 'NOT_AUTHORIZED';
    end if;

    select points_cost, title into v_cost, v_title
    from public.loyalty_rewards
    where id = p_reward_id and is_active = true;

    if v_cost is null then
        raise exception 'REWARD_NOT_FOUND';
    end if;

    insert into public.loyalty_wallets (patient_id, points_balance, lifetime_points)
    values (v_patient_id, 0, 0)
    on conflict (patient_id) do nothing;

    select points_balance into v_balance
    from public.loyalty_wallets
    where patient_id = v_patient_id;

    if v_balance < v_cost then
        raise exception 'INSUFFICIENT_POINTS';
    end if;

    update public.loyalty_wallets
    set points_balance = points_balance - v_cost
    where patient_id = v_patient_id
    returning points_balance into v_balance;

    insert into public.loyalty_transactions (patient_id, points, type, reason, reward_id)
    values (v_patient_id, -v_cost, 'redeem', 'استبدال مكافأة: ' || v_title, p_reward_id);

    insert into public.loyalty_redemptions (patient_id, reward_id, reward_title, points_spent, status)
    values (v_patient_id, p_reward_id, v_title, v_cost, 'pending');

    return v_balance;
end;
$$ language plpgsql security definer;

-- =====================================================================
-- سياسات الأمان (RLS)
-- =====================================================================
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_wallets enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_redemptions enable row level security;

-- المكافآت: الكل يقرأ المفعّلة
drop policy if exists "read active rewards" on public.loyalty_rewards;
create policy "read active rewards"
    on public.loyalty_rewards for select
    using (is_active = true);

drop policy if exists "admin manage rewards" on public.loyalty_rewards;
create policy "admin manage rewards"
    on public.loyalty_rewards for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- المحافظ: المريض يقرأ محفظته فقط
drop policy if exists "patient read own wallet" on public.loyalty_wallets;
create policy "patient read own wallet"
    on public.loyalty_wallets for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

drop policy if exists "admin manage wallets" on public.loyalty_wallets;
create policy "admin manage wallets"
    on public.loyalty_wallets for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- الحركات: المريض يقرأ حركاته فقط
drop policy if exists "patient read own loyalty tx" on public.loyalty_transactions;
create policy "patient read own loyalty tx"
    on public.loyalty_transactions for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

drop policy if exists "admin manage loyalty tx" on public.loyalty_transactions;
create policy "admin manage loyalty tx"
    on public.loyalty_transactions for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- الاستبدالات: المريض يقرأ استبدالاته فقط
drop policy if exists "patient read own redemptions" on public.loyalty_redemptions;
create policy "patient read own redemptions"
    on public.loyalty_redemptions for select
    using (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

drop policy if exists "admin manage redemptions" on public.loyalty_redemptions;
create policy "admin manage redemptions"
    on public.loyalty_redemptions for all
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));

-- =====================================================================
-- الصلاحيات
-- =====================================================================
grant select on public.loyalty_rewards to authenticated, anon;
grant select on public.loyalty_wallets to authenticated;
grant select on public.loyalty_transactions to authenticated;
grant select on public.loyalty_redemptions to authenticated;

grant insert, update, delete on public.loyalty_rewards to authenticated;
grant insert, update, delete on public.loyalty_wallets to authenticated;
grant insert, update, delete on public.loyalty_transactions to authenticated;
grant insert, update, delete on public.loyalty_redemptions to authenticated;

-- دالة الضبط الإداري: لـ service_role فقط
revoke all on function public.loyalty_adjust_points(uuid, integer, text, text, uuid, uuid) from public;
grant execute on function public.loyalty_adjust_points(uuid, integer, text, text, uuid, uuid) to service_role;

-- دالة الاستبدال: للمرضى المسجلين
revoke all on function public.loyalty_redeem_reward(uuid) from public;
grant execute on function public.loyalty_redeem_reward(uuid) to authenticated;

-- =====================================================================
-- مكافآت افتراضية (تُضاف فقط إذا كان الجدول فارغاً)
-- =====================================================================
insert into public.loyalty_rewards (title, description, points_cost, sort_order)
select v.title, v.description, v.points_cost, v.sort_order
from (values
    ('خصم 5% على أي خدمة', 'خصم فوري على إحدى خدمات العيادة', 10, 1),
    ('خصم 15% على جلسة التبييض', 'خصم على جلسة تبييض الأسنان', 30, 2),
    ('جلسة تنظيف مجانية', 'جلسة تنظيف وتلميع الأسنان كاملة', 50, 3)
) as v(title, description, points_cost, sort_order)
where not exists (select 1 from public.loyalty_rewards);
