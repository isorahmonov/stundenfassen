-- Stundenfassen – Supabase Schema
-- Im SQL-Editor unter https://supabase.com/dashboard ausführen

-- ── Tabellen ──────────────────────────────────────────────────

create table if not exists employers (
  id                        uuid primary key,
  user_id                   uuid not null references auth.users(id) on delete cascade,
  name                      text not null,
  farbe                     text not null default '#2563eb',
  stundenlohn_cent          integer not null,
  art                       text not null check (art in ('werkstudent','kurzfristig','minijob','sonstiges')),
  zuschlag_sonntag_prozent  numeric not null default 0,
  zuschlag_feiertag_prozent numeric not null default 0,
  zuschlag_nacht_prozent    numeric not null default 0,
  archiviert                boolean not null default false,
  created_at                timestamptz default now()
);

create table if not exists shifts (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  employer_id uuid not null references employers(id) on delete cascade,
  datum       text not null,       -- ISO YYYY-MM-DD
  start_uhr   text not null,       -- HH:mm
  ende_uhr    text not null,       -- HH:mm
  pause_von   text,                -- HH:mm
  pause_bis   text,                -- HH:mm
  notiz       text,
  created_at  timestamptz default now()
);

create table if not exists settings (
  id                   text not null default 'default',
  user_id              uuid not null references auth.users(id) on delete cascade,
  bundesland           text not null default 'BY',
  steuerklasse         integer not null default 1 check (steuerklasse between 1 and 6),
  kirchensteuer        boolean not null default false,
  kurzfristig_pauschal boolean not null default false,
  primary key (user_id, id)
);

create table if not exists abgleich (
  id                           uuid primary key,
  user_id                      uuid not null references auth.users(id) on delete cascade,
  employer_id                  uuid not null references employers(id) on delete cascade,
  monat                        integer not null check (monat between 1 and 12),
  jahr                         integer not null,
  laut_abrechnung_stunden      numeric,
  tatsaechlich_ausgezahlt_cent integer,
  created_at                   timestamptz default now(),
  unique (user_id, employer_id, monat, jahr)
);

-- ── Row Level Security ────────────────────────────────────────

alter table employers enable row level security;
alter table shifts    enable row level security;
alter table settings  enable row level security;
alter table abgleich  enable row level security;

create policy "own_employers" on employers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_shifts" on shifts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_settings" on settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_abgleich" on abgleich for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indizes ───────────────────────────────────────────────────

create index if not exists idx_shifts_user_datum     on shifts (user_id, datum);
create index if not exists idx_shifts_user_employer  on shifts (user_id, employer_id);
create index if not exists idx_abgleich_slot         on abgleich (user_id, employer_id, monat, jahr);
