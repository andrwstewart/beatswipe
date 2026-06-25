-- Producer-set artist type beat tags (e.g. "Playboi Carti", "Lil Uzi Vert")
-- Replaces the mood column in the upload form; mood column is kept but no longer collected.
alter table beats add column if not exists type_beat_tags text[];

-- Index for array-contains lookups (used in discover search and recommendations)
create index if not exists beats_type_beat_tags_idx on beats using gin (type_beat_tags);
