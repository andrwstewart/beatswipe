-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  banner_url    text,
  bio           text,
  location      text,
  role          text not null default 'artist',
  placements    text[],
  created_at    timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Beats ───────────────────────────────────────────────────────────────────
create table beats (
  id               uuid primary key default gen_random_uuid(),
  producer_id      uuid not null references profiles(id) on delete cascade,
  title            text not null,
  bpm              integer,
  key              text,
  genre            text[],
  mood             text[],
  audio_url        text not null,
  cover_url        text,
  video_url        text,
  duration_seconds integer,
  plays            integer not null default 0,
  likes_count      integer not null default 0,
  downloads_count  integer not null default 0,
  created_at       timestamptz not null default now()
);

alter table beats enable row level security;

create policy "Beats are viewable by everyone"
  on beats for select using (true);

create policy "Producers can insert their own beats"
  on beats for insert with check (auth.uid() = producer_id);

create policy "Producers can update their own beats"
  on beats for update using (auth.uid() = producer_id);

create policy "Producers can delete their own beats"
  on beats for delete using (auth.uid() = producer_id);

-- ─── Interactions ─────────────────────────────────────────────────────────────
create table interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  beat_id     uuid not null references beats(id) on delete cascade,
  type        text not null,
  duration_ms integer,
  created_at  timestamptz not null default now(),
  unique(user_id, beat_id, type)
);

alter table interactions enable row level security;

create policy "Users can view their own interactions"
  on interactions for select using (auth.uid() = user_id);

create policy "Users can insert their own interactions"
  on interactions for insert with check (auth.uid() = user_id);

create policy "Users can delete their own interactions"
  on interactions for delete using (auth.uid() = user_id);

-- Increment/decrement counters on like
create or replace function public.handle_interaction_change()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'like' then
      update beats set likes_count = likes_count + 1 where id = NEW.beat_id;
    elsif NEW.type = 'download' then
      update beats set downloads_count = downloads_count + 1 where id = NEW.beat_id;
    elsif NEW.type = 'play' then
      update beats set plays = plays + 1 where id = NEW.beat_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'like' then
      update beats set likes_count = greatest(0, likes_count - 1) where id = OLD.beat_id;
    elsif OLD.type = 'download' then
      update beats set downloads_count = greatest(0, downloads_count - 1) where id = OLD.beat_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_interaction_change
  after insert or delete on interactions
  for each row execute procedure public.handle_interaction_change();

-- ─── Follows ─────────────────────────────────────────────────────────────────
create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete using (auth.uid() = follower_id);

-- ─── Conversations ───────────────────────────────────────────────────────────
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  participant_a   uuid not null references profiles(id),
  participant_b   uuid not null references profiles(id),
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  unique(participant_a, participant_b)
);

alter table conversations enable row level security;

create policy "Participants can view their conversations"
  on conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can create conversations"
  on conversations for insert
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- ─── Messages ────────────────────────────────────────────────────────────────
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id),
  content         text,
  audio_url       text,
  file_url        text,
  created_at      timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Conversation participants can view messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

-- Update conversation timestamp on new message
create or replace function public.handle_new_message()
returns trigger as $$
begin
  update conversations set last_message_at = now() where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_new_message
  after insert on messages
  for each row execute procedure public.handle_new_message();

-- ─── Notifications ───────────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  data       jsonb not null default '{}',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can mark their own notifications as read"
  on notifications for update using (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index beats_producer_id_idx on beats(producer_id);
create index beats_created_at_idx on beats(created_at desc);
create index interactions_user_beat_idx on interactions(user_id, beat_id);
create index messages_conversation_id_idx on messages(conversation_id, created_at);
create index notifications_user_id_idx on notifications(user_id, created_at desc);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
