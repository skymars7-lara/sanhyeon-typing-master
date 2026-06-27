create extension if not exists pgcrypto;

alter table public.type_io_passages
add column if not exists id uuid default gen_random_uuid();

update public.type_io_passages
set id = gen_random_uuid()
where id is null;

alter table public.type_io_passages
drop constraint if exists type_io_passages_pkey;

alter table public.type_io_passages
alter column id set not null;

alter table public.type_io_passages
add constraint type_io_passages_pkey primary key (id);

create unique index if not exists type_io_passages_subject_title_key
on public.type_io_passages(subject, title);

create table if not exists public.type_io_rooms (
  room_code text primary key,
  teacher_code text,
  teacher_client_id text,
  teacher_active_at timestamptz,
  active_subject text,
  active_title text,
  active_passage text,
  status text default 'waiting',
  started_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.type_io_rooms
add column if not exists teacher_code text;

alter table public.type_io_rooms
add column if not exists teacher_client_id text;

alter table public.type_io_rooms
add column if not exists teacher_active_at timestamptz;

delete from public.type_io_rooms a
using public.type_io_rooms b
where a.teacher_code is not null
  and a.teacher_code = b.teacher_code
  and (
    coalesce(a.updated_at, '1970-01-01'::timestamptz) < coalesce(b.updated_at, '1970-01-01'::timestamptz)
    or (
      coalesce(a.updated_at, '1970-01-01'::timestamptz) = coalesce(b.updated_at, '1970-01-01'::timestamptz)
      and a.ctid < b.ctid
    )
  );

create unique index if not exists type_io_rooms_teacher_code_key
on public.type_io_rooms(teacher_code)
where teacher_code is not null;

create table if not exists public.type_io_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  student_name text not null,
  progress int default 0,
  speed int default 0,
  accuracy int default 100,
  typed_chars int default 0,
  status text default 'waiting',
  finished_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.type_io_passages enable row level security;
alter table public.type_io_rooms enable row level security;
alter table public.type_io_players enable row level security;

drop policy if exists "type_io_passages_select" on public.type_io_passages;
drop policy if exists "type_io_passages_insert" on public.type_io_passages;
drop policy if exists "type_io_passages_update" on public.type_io_passages;
drop policy if exists "type_io_passages_delete" on public.type_io_passages;
drop policy if exists "rooms_select" on public.type_io_rooms;
drop policy if exists "rooms_insert" on public.type_io_rooms;
drop policy if exists "rooms_update" on public.type_io_rooms;
drop policy if exists "rooms_delete" on public.type_io_rooms;
drop policy if exists "players_select" on public.type_io_players;
drop policy if exists "players_insert" on public.type_io_players;
drop policy if exists "players_update" on public.type_io_players;
drop policy if exists "players_delete" on public.type_io_players;

create index if not exists type_io_players_room_updated_idx
on public.type_io_players(room_code, updated_at desc);

create policy "type_io_passages_select"
on public.type_io_passages for select to anon using (true);

create policy "type_io_passages_insert"
on public.type_io_passages for insert to anon with check (true);

create policy "type_io_passages_update"
on public.type_io_passages for update to anon using (true) with check (true);

create policy "type_io_passages_delete"
on public.type_io_passages for delete to anon using (true);

create policy "rooms_select"
on public.type_io_rooms for select to anon using (true);

create policy "rooms_insert"
on public.type_io_rooms for insert to anon with check (true);

create policy "rooms_update"
on public.type_io_rooms for update to anon using (true) with check (true);

create policy "rooms_delete"
on public.type_io_rooms for delete to anon using (true);

create policy "players_select"
on public.type_io_players for select to anon using (true);

create policy "players_insert"
on public.type_io_players for insert to anon with check (true);

create policy "players_update"
on public.type_io_players for update to anon using (true) with check (true);

create policy "players_delete"
on public.type_io_players for delete to anon using (true);

do $$
begin
  alter publication supabase_realtime add table public.type_io_rooms;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.type_io_players;
exception when duplicate_object then
  null;
end $$;
