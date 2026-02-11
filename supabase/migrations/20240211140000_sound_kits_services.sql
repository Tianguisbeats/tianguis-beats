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
create policy "Services are viewable by everyone" on services for select using (true);
create policy "Users can insert their own services" on services for insert with check (auth.uid() = user_id);
create policy "Users can update their own services" on services for update using (auth.uid() = user_id);
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
create policy "Sound Kits are viewable by everyone" on sound_kits for select using (true);
create policy "Producers can insert their own kits" on sound_kits for insert with check (auth.uid() = producer_id);
create policy "Producers can update their own kits" on sound_kits for update using (auth.uid() = producer_id);
create policy "Producers can delete their own kits" on sound_kits for delete using (auth.uid() = producer_id);


-- Create Storage Buckets (if they don't exist, this is idempotent-ish in logic but SQL needs helper)
-- Note: In Supabase SQL Editor, you usually insert into storage.buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sound_kits', 'sound_kits', false, 2147483648, ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream'])
on conflict (id) do update set
  file_size_limit = 2147483648,
  allowed_mime_types = ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sound_kits_covers', 'sound_kits_covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Storage Policies for sound_kits (Private mostly, but public download for authenticated/purchased? For now, producer access)
-- Allow producer to upload/select/delete their own files
create policy "Producer Access Sound Kits" on storage.objects
for all using ( bucket_id = 'sound_kits' and auth.uid()::text = (storage.foldername(name))[1] )
with check ( bucket_id = 'sound_kits' and auth.uid()::text = (storage.foldername(name))[1] );

-- Storage Policies for sound_kits_covers (Public view, Producer upload)
create policy "Public Access Covers" on storage.objects
for select using ( bucket_id = 'sound_kits_covers' );

create policy "Producer Upload Covers" on storage.objects
for insert with check ( bucket_id = 'sound_kits_covers' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Producer Update/Delete Covers" on storage.objects
for all using ( bucket_id = 'sound_kits_covers' and auth.uid()::text = (storage.foldername(name))[1] );
