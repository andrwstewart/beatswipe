create table community_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

create table community_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references community_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

alter table community_posts enable row level security;
alter table community_replies enable row level security;

create policy "Public read community posts"
  on community_posts for select using (true);
create policy "Auth users can post"
  on community_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts"
  on community_posts for delete using (auth.uid() = user_id);

create policy "Public read community replies"
  on community_replies for select using (true);
create policy "Auth users can reply"
  on community_replies for insert with check (auth.uid() = user_id);
create policy "Users can delete own replies"
  on community_replies for delete using (auth.uid() = user_id);

create index community_posts_created_at_idx on community_posts(created_at desc);
create index community_replies_post_id_idx on community_replies(post_id, created_at);
