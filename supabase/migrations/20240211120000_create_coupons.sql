-- Create coupons table
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  producer_id uuid references profiles(id), -- If null, it's a global/admin coupon
  valid_until timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table coupons enable row level security;

-- Policies
create policy "Coupons are viewable by everyone" on coupons for select using (true);
create policy "Producers can insert their own coupons" on coupons for insert with check (auth.uid() = producer_id);
create policy "Owners can update their coupons" on coupons for update using (auth.uid() = producer_id);
create policy "Admins can do everything" on coupons using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Index for faster lookup
create index coupons_code_idx on coupons(code);
