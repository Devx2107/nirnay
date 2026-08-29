-- Hospital Finder - initial public schema
-- This migration is intentionally zero-auth for the demo. Do not use these
-- anonymous write policies in a production deployment.

create extension if not exists pgcrypto;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  phone text not null,
  address text,
  address_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  specialty text not null,
  available boolean not null default false,
  schedule jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (hospital_id, specialty)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null unique references public.hospitals(id) on delete cascade,
  icu_capacity integer not null default 0 check (icu_capacity >= 0),
  icu_available integer not null default 0 check (icu_available between 0 and icu_capacity),
  general_capacity integer not null default 0 check (general_capacity >= 0),
  general_available integer not null default 0 check (general_available between 0 and general_capacity),
  updated_at timestamptz not null default now()
);

create table if not exists public.blood_stock (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  blood_type text not null check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  available boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (hospital_id, blood_type)
);

create index if not exists hospitals_location_idx
  on public.hospitals (latitude, longitude);
create index if not exists specialists_hospital_idx
  on public.specialists (hospital_id);
create index if not exists blood_stock_hospital_idx
  on public.blood_stock (hospital_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hospitals_set_updated_at on public.hospitals;
create trigger hospitals_set_updated_at
before update on public.hospitals
for each row execute function public.set_updated_at();

drop trigger if exists specialists_set_updated_at on public.specialists;
create trigger specialists_set_updated_at
before update on public.specialists
for each row execute function public.set_updated_at();

drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

drop trigger if exists blood_stock_set_updated_at on public.blood_stock;
create trigger blood_stock_set_updated_at
before update on public.blood_stock
for each row execute function public.set_updated_at();

alter table public.hospitals enable row level security;
alter table public.specialists enable row level security;
alter table public.inventory enable row level security;
alter table public.blood_stock enable row level security;

drop policy if exists hospitals_anon_select on public.hospitals;
create policy hospitals_anon_select on public.hospitals for select to anon using (true);
drop policy if exists hospitals_anon_insert on public.hospitals;
create policy hospitals_anon_insert on public.hospitals for insert to anon with check (true);
drop policy if exists hospitals_anon_update on public.hospitals;
create policy hospitals_anon_update on public.hospitals for update to anon using (true) with check (true);

drop policy if exists specialists_anon_select on public.specialists;
create policy specialists_anon_select on public.specialists for select to anon using (true);
drop policy if exists specialists_anon_insert on public.specialists;
create policy specialists_anon_insert on public.specialists for insert to anon with check (true);
drop policy if exists specialists_anon_update on public.specialists;
create policy specialists_anon_update on public.specialists for update to anon using (true) with check (true);

drop policy if exists inventory_anon_select on public.inventory;
create policy inventory_anon_select on public.inventory for select to anon using (true);
drop policy if exists inventory_anon_insert on public.inventory;
create policy inventory_anon_insert on public.inventory for insert to anon with check (true);
drop policy if exists inventory_anon_update on public.inventory;
create policy inventory_anon_update on public.inventory for update to anon using (true) with check (true);

drop policy if exists blood_stock_anon_select on public.blood_stock;
create policy blood_stock_anon_select on public.blood_stock for select to anon using (true);
drop policy if exists blood_stock_anon_insert on public.blood_stock;
create policy blood_stock_anon_insert on public.blood_stock for insert to anon with check (true);
drop policy if exists blood_stock_anon_update on public.blood_stock;
create policy blood_stock_anon_update on public.blood_stock for update to anon using (true) with check (true);
