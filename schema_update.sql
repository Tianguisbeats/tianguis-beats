-- Add play_count if it doesn't exist
alter table public.beats 
add column if not exists play_count bigint default 0;

-- Add sale_count if it doesn't exist
alter table public.beats 
add column if not exists sale_count bigint default 0;

-- Create an index to optimize sorting by these counts
create index if not exists beats_play_count_idx on public.beats (play_count desc);
create index if not exists beats_sale_count_idx on public.beats (sale_count desc);
