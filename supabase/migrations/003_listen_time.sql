create table listen_events (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  beat_id        uuid        not null references beats(id) on delete cascade,
  listen_seconds integer     not null default 0,
  created_at     timestamptz not null default now()
);

create index listen_events_user_id_idx on listen_events(user_id);
create index listen_events_beat_id_idx on listen_events(beat_id);

alter table listen_events enable row level security;

create policy "Users can insert their own listen events"
  on listen_events for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own listen events"
  on listen_events for select
  using (auth.uid() = user_id);
