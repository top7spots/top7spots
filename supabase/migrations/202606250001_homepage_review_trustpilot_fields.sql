alter table public.homepage_reviews
  add column if not exists rating integer,
  add column if not exists source text,
  add column if not exists review_url text,
  add column if not exists show_on_homepage boolean;

update public.homepage_reviews
set
  rating = coalesce(rating, 5),
  source = coalesce(nullif(trim(source), ''), 'Trustpilot'),
  show_on_homepage = coalesce(show_on_homepage, is_published)
where rating is null
  or source is null
  or trim(source) = ''
  or show_on_homepage is null;

alter table public.homepage_reviews
  alter column rating set default 5,
  alter column source set default 'Trustpilot',
  alter column show_on_homepage set default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'homepage_reviews_rating_range_check'
      and conrelid = 'public.homepage_reviews'::regclass
  ) then
    alter table public.homepage_reviews
      add constraint homepage_reviews_rating_range_check check (rating is null or rating between 1 and 5);
  end if;
end $$;

create index if not exists homepage_reviews_homepage_sort_created_idx
  on public.homepage_reviews (is_published, show_on_homepage, sort_order, created_at desc);

drop policy if exists "Published homepage reviews are readable" on public.homepage_reviews;

create policy "Published homepage reviews are readable"
  on public.homepage_reviews for select
  to anon
  using (is_published = true and coalesce(show_on_homepage, true) = true);
