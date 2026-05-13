-- TurnoCheck — Initial Schema
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard → SQL Editor

create extension if not exists citext;

-- ─── UPDATED_AT TRIGGER FUNCTION ──────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── WORKSPACES ───────────────────────────────────────────────────────────────

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger update_workspaces_updated_at
before update on workspaces
for each row execute function update_updated_at_column();

-- ─── SECTIONS ─────────────────────────────────────────────────────────────────

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  color text,
  is_closing_section boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sections_workspace on sections(workspace_id, "order");

create trigger update_sections_updated_at
before update on sections
for each row execute function update_updated_at_column();

-- ─── TURNOS ───────────────────────────────────────────────────────────────────

create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Only one active turno per workspace
create unique index if not exists uniq_active_turno_per_workspace
  on turnos(workspace_id) where status = 'active';

create index if not exists idx_turnos_workspace on turnos(workspace_id, status);

create trigger update_turnos_updated_at
before update on turnos
for each row execute function update_updated_at_column();

-- ─── RECURRING TASKS ──────────────────────────────────────────────────────────

create table if not exists recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  section_id uuid references sections(id) on delete set null,
  title text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  recurrence_type text not null default 'daily'
    check (recurrence_type in ('daily', 'weekly', 'custom')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_recurring_workspace on recurring_tasks(workspace_id, is_active);

create trigger update_recurring_tasks_updated_at
before update on recurring_tasks
for each row execute function update_updated_at_column();

-- ─── TASKS ────────────────────────────────────────────────────────────────────

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos(id) on delete cascade,
  section_id uuid references sections(id) on delete set null,
  recurring_task_id uuid references recurring_tasks(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  is_pinned boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tasks_turno_id on tasks(turno_id);
create index if not exists idx_tasks_section_id on tasks(section_id);
create index if not exists idx_tasks_status on tasks(status, turno_id);

create trigger update_tasks_updated_at
before update on tasks
for each row execute function update_updated_at_column();
