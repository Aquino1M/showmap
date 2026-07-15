-- Execute uma vez no Supabase SQL Editor para registrar o artista de cada show.
alter table public.events add column if not exists artist_name text;
