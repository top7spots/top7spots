alter table public.cities add column if not exists hero_image_alt text;
alter table public.cities add column if not exists hero_image_caption text;
alter table public.cities add column if not exists card_image_alt text;
alter table public.cities add column if not exists card_image_caption text;
alter table public.cities add column if not exists featured_image_alt text;
alter table public.cities add column if not exists featured_image_caption text;

alter table public.destinations add column if not exists image_alt text;
alter table public.destinations add column if not exists image_caption text;
alter table public.destinations add column if not exists gallery_images_metadata jsonb;

alter table public.attractions add column if not exists image_alt text;
alter table public.attractions add column if not exists image_caption text;

alter table public.restaurants add column if not exists image_alt text;
alter table public.restaurants add column if not exists image_caption text;

update public.cities
set
  hero_image_alt = coalesce(nullif(hero_image_alt, ''), trim(concat_ws(' ', name, 'city view in', nullif(country, '')))),
  hero_image_caption = coalesce(
    nullif(hero_image_caption, ''),
    trim(concat('Explore the best places to visit, eat, and experience in ', concat_ws(', ', nullif(name, ''), nullif(country, '')), '.'))
  ),
  card_image_alt = coalesce(nullif(card_image_alt, ''), trim(concat_ws(' ', name, 'city travel card image in', nullif(country, '')))),
  card_image_caption = coalesce(
    nullif(card_image_caption, ''),
    trim(concat('Plan a trip to ', concat_ws(', ', nullif(name, ''), nullif(country, '')), ' with curated places, restaurants, and travel ideas.'))
  ),
  featured_image_alt = coalesce(nullif(featured_image_alt, ''), trim(concat_ws(' ', 'Featured travel image of', concat_ws(', ', nullif(name, ''), nullif(country, ''))))),
  featured_image_caption = coalesce(
    nullif(featured_image_caption, ''),
    trim(concat('Discover why ', concat_ws(', ', nullif(name, ''), nullif(country, '')), ' is one of the featured Top7Spots travel cities.'))
  )
where
  hero_image_alt is null or hero_image_alt = ''
  or hero_image_caption is null or hero_image_caption = ''
  or card_image_alt is null or card_image_alt = ''
  or card_image_caption is null or card_image_caption = ''
  or featured_image_alt is null or featured_image_alt = ''
  or featured_image_caption is null or featured_image_caption = '';

update public.destinations d
set
  image_alt = coalesce(
    nullif(d.image_alt, ''),
    trim(concat_ws(' ', d.name, lower(coalesce(nullif(d.category, ''), 'travel destination')), 'in', concat_ws(', ', nullif(d.city, ''), nullif(c.country, ''))))
  ),
  image_caption = coalesce(
    nullif(d.image_caption, ''),
    trim(concat('A scenic view of ', d.name, ', one of the popular places to visit in ', concat_ws(', ', nullif(d.city, ''), nullif(c.country, '')), '.'))
  )
from public.cities c
where d.city_id = c.id
  and (d.image_alt is null or d.image_alt = '' or d.image_caption is null or d.image_caption = '');

update public.destinations
set gallery_images_metadata = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'src', image_src,
        'alt', trim(concat('Gallery photo ', image_index, ' of ', destinations.name, case when destinations.city is not null and destinations.city <> '' then concat(' in ', destinations.city) else '' end)),
        'caption', trim(concat('Gallery photo ', image_index, ' from ', destinations.name, '.'))
      )
      order by image_index
    ),
    '[]'::jsonb
  )
  from unnest(gallery_images) with ordinality as gallery(image_src, image_index)
)
where gallery_images_metadata is null;

update public.attractions a
set
  image_alt = coalesce(
    nullif(a.image_alt, ''),
    trim(concat_ws(' ', a.name, 'attraction in', concat_ws(', ', nullif(a.city, ''), nullif(c.country, ''))))
  ),
  image_caption = coalesce(
    nullif(a.image_caption, ''),
    trim(concat('A closer look at ', a.name, ', a popular attraction in ', concat_ws(', ', nullif(a.city, ''), nullif(c.country, '')), '.'))
  )
from public.cities c
where a.city_id = c.id
  and (a.image_alt is null or a.image_alt = '' or a.image_caption is null or a.image_caption = '');

update public.restaurants r
set
  image_alt = coalesce(
    nullif(r.image_alt, ''),
    trim(concat_ws(' ', r.name, 'restaurant in', concat_ws(', ', nullif(c.name, ''), nullif(c.country, ''))))
  ),
  image_caption = coalesce(
    nullif(r.image_caption, ''),
    trim(concat('Dining at ', r.name, ' in ', concat_ws(', ', nullif(c.name, ''), nullif(c.country, '')), '.'))
  )
from public.cities c
where r.city_id = c.id
  and (r.image_alt is null or r.image_alt = '' or r.image_caption is null or r.image_caption = '');
