-- Run once in the reading project's SQL Editor. Existing records are preserved.
begin;
create table if not exists public.attendance (
 member_id text not null check (member_id ~ '^member-(0[1-9]|[12][0-9]|3[0-6])$'),
 date date not null,
 checked_at timestamptz not null default now(),
 reflection text not null default '' check (char_length(reflection) <= 2000),
 primary key (member_id,date)
);
comment on column public.attendance.date is 'Stable original reading date, not rescheduled calendar date. See schedule.ts; do not shift imported dates again.';
create index if not exists attendance_date_idx on public.attendance(date);
alter table public.attendance enable row level security;
revoke all on public.attendance from anon, authenticated;
grant select, insert, update on public.attendance to service_role;
commit;
