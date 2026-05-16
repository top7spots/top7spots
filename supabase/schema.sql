create table if not exists public.cities (
  id text primary key,
  name text not null,
  slug text not null unique,
  country text,
  country_code text,
  region text,
  short_description text,
  long_description text,
  hero_image text,
  card_image text,
  featured_image text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  seo_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.destinations (
  id text primary key,
  city_id text references public.cities(id) on delete set null,
  city_slug text not null,
  slug text not null,
  name text not null,
  city text,
  category text,
  location text,
  region text,
  duration text,
  best_season text,
  image text,
  gallery_images text[] not null default '{}',
  summary text,
  description text,
  highlights text[] not null default '{}',
  practical_info text[] not null default '{}',
  how_to_go text,
  travel_tips text[] not null default '{}',
  nearby_attractions text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, slug)
);

create table if not exists public.guides (
  id text primary key,
  city_id text references public.cities(id) on delete set null,
  city_slug text not null,
  slug text not null,
  title text not null,
  excerpt text,
  content text[] not null default '{}',
  cover_image text,
  image text,
  author text,
  read_time text,
  category text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, slug)
);

create table if not exists public.attractions (
  id text primary key,
  city_id text references public.cities(id) on delete set null,
  city_slug text not null,
  name text not null,
  slug text not null,
  city text,
  image text,
  category text,
  type text,
  description text,
  summary text,
  recommended_time text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  unique (city_slug, slug)
);

create index if not exists cities_status_display_order_idx on public.cities (status, display_order);
create index if not exists destinations_city_status_display_order_idx on public.destinations (city_slug, status, display_order);
create index if not exists guides_city_status_display_order_idx on public.guides (city_slug, status, display_order);
create index if not exists attractions_city_status_display_order_idx on public.attractions (city_slug, status, display_order);

alter table public.cities enable row level security;
alter table public.destinations enable row level security;
alter table public.guides enable row level security;
alter table public.attractions enable row level security;

drop policy if exists "Public cities are readable" on public.cities;
drop policy if exists "Published destinations are readable" on public.destinations;
drop policy if exists "Published guides are readable" on public.guides;
drop policy if exists "Published attractions are readable" on public.attractions;

create policy "Public cities are readable"
  on public.cities for select
  to anon
  using (status = 'published');

create policy "Published destinations are readable"
  on public.destinations for select
  to anon
  using (status = 'published');

create policy "Published guides are readable"
  on public.guides for select
  to anon
  using (status = 'published');

create policy "Published attractions are readable"
  on public.attractions for select
  to anon
  using (status = 'published');

insert into storage.buckets (id, name, public)
values ('top7spots-media', 'top7spots-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Top7Spots media is publicly readable" on storage.objects;

create policy "Top7Spots media is publicly readable"
  on storage.objects for select
  to anon
  using (bucket_id = 'top7spots-media');
