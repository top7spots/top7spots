alter table public.guides add column if not exists guide_type text not null default 'practical';
alter table public.guides add column if not exists guide_data jsonb not null default '{}'::jsonb;
alter table public.guides add column if not exists guide_selected_items jsonb not null default '[]'::jsonb;

update public.guides
set guide_type = 'practical'
where guide_type is null or guide_type = '';

alter table public.guides drop constraint if exists guides_guide_type_check;
alter table public.guides add constraint guides_guide_type_check
  check (guide_type in (
    'best_places',
    'things_to_do',
    'itinerary',
    'day_trip',
    'road_trip',
    'practical',
    'destination_combination',
    'comparison',
    'seasonal'
  ));
