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
  faqs jsonb not null default '[]'::jsonb,
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
  target_type text not null default 'city' check (target_type in ('country', 'city', 'destination')),
  country_id text not null default '',
  city_id text references public.cities(id) on delete set null,
  city_slug text not null default '',
  destination_id text references public.destinations(id) on delete set null,
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
  seo_keywords text[] not null default '{}',
  cover_image_alt text not null default '',
  faqs jsonb not null default '[]'::jsonb,
  related_guide_slugs text[] not null default '{}',
  related_place_slugs text[] not null default '{}',
  table_of_contents jsonb not null default '[]'::jsonb,
  listing_blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, slug)
);

alter table public.guides add column if not exists target_type text not null default 'city';
alter table public.guides add column if not exists country_id text not null default '';
alter table public.guides add column if not exists destination_id text references public.destinations(id) on delete set null;
alter table public.guides alter column city_slug set default '';
update public.guides set target_type = 'city' where target_type is null or target_type = '';
alter table public.guides drop constraint if exists guides_target_type_check;
alter table public.guides add constraint guides_target_type_check check (target_type in ('country', 'city', 'destination'));
alter table public.guides add column if not exists seo_keywords text[] not null default '{}';
alter table public.guides add column if not exists cover_image_alt text not null default '';
alter table public.guides add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.guides add column if not exists related_guide_slugs text[] not null default '{}';
alter table public.guides add column if not exists related_place_slugs text[] not null default '{}';
alter table public.guides add column if not exists table_of_contents jsonb not null default '[]'::jsonb;
alter table public.guides add column if not exists listing_blocks jsonb not null default '[]'::jsonb;
alter table public.destinations add column if not exists faqs jsonb not null default '[]'::jsonb;

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

create table if not exists public.restaurants (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  long_description text,
  image text,
  city_id text references public.cities(id) on delete set null,
  destination_id text references public.destinations(id) on delete set null,
  country_slug text not null default '',
  cuisine_type text,
  price_range text,
  address text,
  google_maps_url text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_reviews (
  id text primary key,
  name text not null,
  review_text text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_faqs (
  id text primary key,
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cities_status_display_order_idx on public.cities (status, display_order);
create index if not exists destinations_city_status_display_order_idx on public.destinations (city_slug, status, display_order);
create index if not exists guides_city_status_display_order_idx on public.guides (city_slug, status, display_order);
create index if not exists guides_country_status_updated_idx on public.guides (country_id, status, updated_at);
create index if not exists guides_destination_status_updated_idx on public.guides (destination_id, status, updated_at);
create index if not exists attractions_city_status_display_order_idx on public.attractions (city_slug, status, display_order);
create index if not exists restaurants_slug_idx on public.restaurants (slug);
create index if not exists restaurants_city_idx on public.restaurants (city_id);
create index if not exists restaurants_destination_idx on public.restaurants (destination_id);
create index if not exists restaurants_country_idx on public.restaurants (country_slug);
create index if not exists restaurants_published_idx on public.restaurants (published);
create index if not exists homepage_reviews_published_sort_order_idx on public.homepage_reviews (is_published, sort_order);
create index if not exists homepage_faqs_published_sort_order_idx on public.homepage_faqs (is_published, sort_order);

alter table public.cities enable row level security;
alter table public.destinations enable row level security;
alter table public.guides enable row level security;
alter table public.attractions enable row level security;
alter table public.restaurants enable row level security;
alter table public.homepage_reviews enable row level security;
alter table public.homepage_faqs enable row level security;

drop policy if exists "Public cities are readable" on public.cities;
drop policy if exists "Published destinations are readable" on public.destinations;
drop policy if exists "Published guides are readable" on public.guides;
drop policy if exists "Published attractions are readable" on public.attractions;
drop policy if exists "Published restaurants are readable" on public.restaurants;
drop policy if exists "Published homepage reviews are readable" on public.homepage_reviews;
drop policy if exists "Published homepage FAQs are readable" on public.homepage_faqs;

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

create policy "Published restaurants are readable"
  on public.restaurants for select
  to anon
  using (published = true);

create policy "Published homepage reviews are readable"
  on public.homepage_reviews for select
  to anon
  using (is_published = true);

create policy "Published homepage FAQs are readable"
  on public.homepage_faqs for select
  to anon
  using (is_published = true);

insert into storage.buckets (id, name, public)
values ('top7spots-media', 'top7spots-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Top7Spots media is publicly readable" on storage.objects;

create policy "Top7Spots media is publicly readable"
  on storage.objects for select
  to anon
  using (bucket_id = 'top7spots-media');
