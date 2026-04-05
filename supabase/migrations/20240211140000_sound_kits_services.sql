-- Create services table
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  titulo text not null,
  descripcion text,
  precio numeric not null check (precio >= 0),
  tipo_servicio text default 'mixing_mastering',
  tiempo_entrega_dias integer default 3,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS for services
alter table services enable row level security;

-- Policies for services
drop policy if exists "Services are viewable by everyone" on services;
create policy "Services are viewable by everyone" on services for select using (true);

drop policy if exists "Users can insert their own services" on services;
create policy "Users can insert their own services" on services for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own services" on services;
create policy "Users can update their own services" on services for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own services" on services;
create policy "Users can delete their own services" on services for delete using (auth.uid() = user_id);

-- Create sound_kits table
create table if not exists sound_kits (
  id uuid default gen_random_uuid() primary key,
  producer_id uuid references profiles(id) not null,
  title text not null,
  description text,
  price numeric not null check (price >= 0),
  file_url text not null, -- Path in storage
  cover_url text, -- Public URL or path
  is_public boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS for sound_kits
alter table sound_kits enable row level security;

-- Policies for sound_kits
drop policy if exists "Sound Kits are viewable by everyone" on sound_kits;
create policy "Sound Kits are viewable by everyone" on sound_kits for select using (true);

drop policy if exists "Producers can insert their own kits" on sound_kits;
create policy "Producers can insert their own kits" on sound_kits for insert with check (auth.uid() = producer_id);

drop policy if exists "Producers can update their own kits" on sound_kits;
create policy "Producers can update their own kits" on sound_kits for update using (auth.uid() = producer_id);

drop policy if exists "Producers can delete their own kits" on sound_kits;
create policy "Producers can delete their own kits" on sound_kits for delete using (auth.uid() = producer_id);


-- Create Storage Buckets (if they don't exist, this is idempotent-ish in logic but SQL needs helper)
-- Note: In Supabase SQL Editor, you usually insert into storage.buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sound_kits', 'sound_kits', false, 2147483648, ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream'])
on conflict (id) do update set
  file_size_limit = 2147483648,
  allowed_mime_types = ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream'];

-- Explicit update to match user request "vuélvelo a actualizar"
update storage.buckets
set file_size_limit = 2147483648,
    allowed_mime_types = ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream']
where id = 'sound_kits';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sound_kits_covers', 'sound_kits_covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Explicit update for covers
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
where id = 'sound_kits_covers';

-- Storage Policies for sound_kits
drop policy if exists "Producer Access Sound Kits" on storage.objects;
create policy "Producer Access Sound Kits" on storage.objects
for all using (
  bucket_id = 'sound_kits'
  and (
    -- Allow access if folder name is user_id (legacy) OR username (new)
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
)
with check (
  bucket_id = 'sound_kits'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
);

-- Storage Policies for sound_kits_covers
drop policy if exists "Public Access Covers" on storage.objects;
create policy "Public Access Covers" on storage.objects
for select using ( bucket_id = 'sound_kits_covers' );

drop policy if exists "Producer Upload Covers" on storage.objects;
create policy "Producer Upload Covers" on storage.objects
for insert with check (
  bucket_id = 'sound_kits_covers'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists "Producer Update/Delete Covers" on storage.objects;
create policy "Producer Update/Delete Covers" on storage.objects
for all using (
  bucket_id = 'sound_kits_covers'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
);

-- Verification Docs Bucket & Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf']
where id = 'verification-docs';

drop policy if exists "User Upload Verification" on storage.objects;
create policy "User Upload Verification" on storage.objects
for insert with check (
  bucket_id = 'verification-docs'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists "User Select Verification" on storage.objects;
create policy "User Select Verification" on storage.objects
for select using (
  bucket_id = 'verification-docs'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or
    exists (
      select 1 from profiles
      where id = auth.uid()
      and username = (storage.foldername(name))[1]
    )
  )
);
