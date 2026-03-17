-- MoolaBiz Hub — Central Tenant Registry
-- Run this in your HUB Supabase project (separate from bot DBs)

create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id                    uuid primary key default uuid_generate_v4(),
  business_name         text not null,
  whatsapp_number       text not null,
  payment_provider      text not null default 'yoco' check (payment_provider in ('yoco','ozow','payfast')),
  subdomain             text unique not null,
  coolify_service_id    text,
  status                text not null default 'provisioning'
                          check (status in ('provisioning','awaiting_config','live','error','suspended')),
  whatsapp_phone_id     text,
  whatsapp_token        text,
  webhook_verify_token  text not null,
  plan                  text not null default 'basic' check (plan in ('basic','growth')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists tenants_status_idx on tenants(status);
create index if not exists tenants_created_at_idx on tenants(created_at);

alter table tenants enable row level security;

-- Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on tenants
  for each row
  execute function update_updated_at_column();
