-- MoolaBiz Database Schema
-- Run this against your Supabase project via the SQL editor.

create extension if not exists "uuid-ossp";

-- ─── Businesses (1 row per single-tenant deployment) ─────────────────────────
create table if not exists businesses (
  id               uuid primary key default uuid_generate_v4(),
  whatsapp_number  text unique not null,
  name             text not null default '',
  products         jsonb not null default '[]',
  hours            text not null default 'Mon-Fri 9am-5pm',
  plan             text not null default 'basic' check (plan in ('basic', 'growth')),
  payment_provider text check (payment_provider in ('yoco', 'ozow', 'payfast')),
  created_at       timestamptz not null default now()
);

create table if not exists customers (
  id               uuid primary key default uuid_generate_v4(),
  whatsapp_number  text not null,
  business_id      uuid not null references businesses(id) on delete cascade,
  name             text not null default '',
  last_order_date  timestamptz,
  created_at       timestamptz not null default now(),
  unique (whatsapp_number, business_id)
);

create table if not exists orders (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references businesses(id) on delete cascade,
  customer_id       uuid not null references customers(id) on delete cascade,
  items             jsonb not null default '[]',
  total             numeric(10, 2) not null default 0,
  status            text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  payment_provider  text,
  payment_link      text,
  payment_reference text,
  yoco_order_id     text,
  created_at        timestamptz not null default now()
);

create table if not exists appointments (
  id           uuid primary key default uuid_generate_v4(),
  business_id  uuid not null references businesses(id) on delete cascade,
  customer_id  uuid not null references customers(id) on delete cascade,
  service      text not null,
  datetime     timestamptz not null,
  status       text not null default 'scheduled' check (status in ('scheduled','confirmed','completed','cancelled')),
  created_at   timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists orders_business_id_idx on orders(business_id);
create index if not exists orders_created_at_idx on orders(created_at);
create index if not exists customers_business_id_idx on customers(business_id);
create index if not exists appointments_business_id_idx on appointments(business_id);
create index if not exists appointments_datetime_idx on appointments(datetime);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table businesses enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table appointments enable row level security;
