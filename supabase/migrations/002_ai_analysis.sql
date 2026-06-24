-- ─── pgvector ────────────────────────────────────────────────────────────────
create extension if not exists vector;

-- ─── New AI columns on beats ──────────────────────────────────────────────────
alter table beats
  add column if not exists description          text,
  add column if not exists detailed_description text,
  add column if not exists recommended_artists  text[],
  add column if not exists ai_genres            text[],
  add column if not exists ai_mood              text,
  add column if not exists ai_energy            integer,
  add column if not exists ai_key_features      text[],
  add column if not exists underground_vibe     integer,
  add column if not exists ai_analysis          jsonb,
  add column if not exists analysis_status      text default 'pending';

-- ─── Music knowledge base (RAG) ──────────────────────────────────────────────
create table if not exists music_knowledge (
  id                uuid primary key default gen_random_uuid(),
  artist_name       text not null unique,
  style_description text not null,
  associated_genres text[],
  typical_bpm_range text,
  mood_tags         text[],
  underground_level integer,
  era               text,
  similar_artists   text[],
  embedding         vector(1536),
  created_at        timestamptz not null default now()
);

alter table music_knowledge enable row level security;

create policy "Music knowledge is publicly readable"
  on music_knowledge for select using (true);

create policy "Service role can manage music knowledge"
  on music_knowledge for all using (auth.role() = 'service_role');

-- ─── Allow AI service (via service role) to write AI analysis to beats ────────
-- The existing "Producers can update their own beats" policy is preserved.
-- Service role bypasses RLS by default — no extra policy needed.

-- ─── Vector similarity index ─────────────────────────────────────────────────
create index if not exists music_knowledge_embedding_idx
  on music_knowledge using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- ─── Indexes for AI fields ───────────────────────────────────────────────────
create index if not exists beats_analysis_status_idx on beats(analysis_status);
create index if not exists beats_ai_energy_idx on beats(ai_energy);
create index if not exists beats_underground_vibe_idx on beats(underground_vibe);

-- ─── Vector similarity search function ──────────────────────────────────────
create or replace function match_music_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  artist_name       text,
  style_description text,
  associated_genres text[],
  typical_bpm_range text,
  mood_tags         text[],
  underground_level integer,
  era               text,
  similar_artists   text[],
  similarity        float
)
language sql stable
as $$
  select
    artist_name,
    style_description,
    associated_genres,
    typical_bpm_range,
    mood_tags,
    underground_level,
    era,
    similar_artists,
    1 - (embedding <=> query_embedding) as similarity
  from music_knowledge
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
