-- Audio embedding column on beats
alter table beats add column if not exists audio_embedding vector(1536);

-- IVFFlat index for cosine similarity search (lists=10 works for small tables; tune upward as data grows)
create index if not exists beats_audio_embedding_idx
  on beats using ivfflat (audio_embedding vector_cosine_ops)
  with (lists = 10);

-- Find beats sonically similar to a given embedding vector
create or replace function match_beats_by_audio(
  query_embedding vector(1536),
  match_threshold float default 0.55,
  match_count int default 30,
  exclude_ids uuid[] default array[]::uuid[]
)
returns table (
  id uuid,
  similarity float
)
language sql stable
as $$
  select
    b.id,
    1 - (b.audio_embedding <=> query_embedding) as similarity
  from beats b
  where
    b.audio_embedding is not null
    and 1 - (b.audio_embedding <=> query_embedding) > match_threshold
    and not (b.id = any(exclude_ids))
  order by b.audio_embedding <=> query_embedding
  limit match_count;
$$;

-- Find beats sonically similar to a user's taste (derived from their liked beats)
-- Uses avg() aggregation to compute a taste centroid from the last 10 liked beats with embeddings
create or replace function match_beats_for_user(
  target_user_id uuid,
  match_count int default 30,
  match_threshold float default 0.55,
  exclude_ids uuid[] default array[]::uuid[]
)
returns table (
  id uuid,
  similarity float
)
language sql stable
as $$
  with taste as (
    select avg(b.audio_embedding) as centroid
    from (
      select b2.audio_embedding
      from interactions i
      join beats b2 on b2.id = i.beat_id
      where i.user_id = target_user_id
        and i.type = 'like'
        and b2.audio_embedding is not null
      order by i.created_at desc
      limit 10
    ) b
  )
  select
    beats.id,
    1 - (beats.audio_embedding <=> taste.centroid) as similarity
  from beats, taste
  where
    taste.centroid is not null
    and beats.audio_embedding is not null
    and 1 - (beats.audio_embedding <=> taste.centroid) > match_threshold
    and not (beats.id = any(exclude_ids))
  order by beats.audio_embedding <=> taste.centroid
  limit match_count;
$$;
