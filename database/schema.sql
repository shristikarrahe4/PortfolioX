-- =====================================================================
-- PortfolioX database schema (Supabase PostgreSQL)
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- It is safe to run more than once (it uses IF NOT EXISTS / DROP ... IF EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helper: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. profiles  (one row per Supabase Auth user; id = auth.users.id)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  username           text unique,
  full_name          text,
  headline           text,
  intro              text,
  college            text,
  course             text,
  year_of_study      smallint,
  technical_skills   text[] not null default '{}',
  soft_skills        text[] not null default '{}',
  interests          text[] not null default '{}',
  github_url         text,
  linkedin_url       text,
  website_url        text,
  contact_email      text,
  is_public          boolean not null default false,
  show_college       boolean not null default true,
  show_contact_email boolean not null default false,
  show_interests     boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint profiles_public_needs_username check (not is_public or username is not null),
  constraint profiles_year_range check (year_of_study is null or year_of_study between 1 and 6),
  constraint profiles_text_lengths check (
    char_length(coalesce(full_name, '')) <= 100 and char_length(coalesce(headline, '')) <= 120 and
    char_length(coalesce(intro, '')) <= 600 and char_length(coalesce(college, '')) <= 150 and
    char_length(coalesce(course, '')) <= 100 and char_length(coalesce(contact_email, '')) <= 200),
  constraint profiles_skill_counts check (
    cardinality(technical_skills) <= 30 and cardinality(soft_skills) <= 30 and cardinality(interests) <= 30),
  constraint profiles_url_format check (
    (github_url is null or github_url ~* '^https?://') and
    (linkedin_url is null or linkedin_url ~* '^https?://') and
    (website_url is null or website_url ~* '^https?://'))
);

-- ---------------------------------------------------------------------
-- 3. projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  description  text not null,
  purpose      text,
  technologies text[] not null default '{}',
  category     text not null,
  role         text,
  github_url   text,
  live_url     text,
  completed_on date,
  is_featured  boolean not null default false,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint projects_title_len check (char_length(title) between 2 and 100),
  constraint projects_description_len check (char_length(description) between 10 and 500),
  constraint projects_purpose_len check (purpose is null or char_length(purpose) <= 500),
  constraint projects_role_len check (role is null or char_length(role) <= 200),
  constraint projects_tech_count check (cardinality(technologies) <= 20),
  constraint projects_category check (category in
    ('Web Development','Mobile App','Data Science','Embedded / IoT','Core Engineering','Game Development','Research','Other')),
  constraint projects_url_format check (
    (github_url is null or github_url ~* '^https?://') and (live_url is null or live_url ~* '^https?://'))
);
create index if not exists projects_user_id_idx on public.projects (user_id);

-- ---------------------------------------------------------------------
-- 4. achievements
-- ---------------------------------------------------------------------
create table if not exists public.achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  organization   text not null,
  category       text not null,
  earned_on      date not null,
  credential_url text,
  description    text,
  is_public      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint achievements_title_len check (char_length(title) between 2 and 120),
  constraint achievements_org_len check (char_length(organization) between 2 and 120),
  constraint achievements_desc_len check (description is null or char_length(description) <= 400),
  constraint achievements_category check (category in
    ('Certification','Workshop','Competition','Hackathon','Academic','Leadership','Other')),
  constraint achievements_url_format check (credential_url is null or credential_url ~* '^https?://')
);
create index if not exists achievements_user_id_idx on public.achievements (user_id);

-- ---------------------------------------------------------------------
-- 5. resume_details  (private resume-only information, one row per student)
-- ---------------------------------------------------------------------
create table if not exists public.resume_details (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  objective         text,
  phone             text,
  location          text,
  education_summary text,
  availability      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint resume_objective_len check (objective is null or char_length(objective) <= 400),
  constraint resume_phone_len check (phone is null or char_length(phone) <= 20),
  constraint resume_location_len check (location is null or char_length(location) <= 100),
  constraint resume_education_len check (education_summary is null or char_length(education_summary) <= 300),
  constraint resume_availability_len check (availability is null or char_length(availability) <= 150)
);

-- ---------------------------------------------------------------------
-- 6. checklist_items  (only the tasks the student ticks by hand)
-- ---------------------------------------------------------------------
create table if not exists public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  task_key   text not null,
  is_done    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_task_key check (task_key in
    ('review_skills','save_resume_pdf','share_portfolio','practice_projects')),
  constraint checklist_unique_task unique (user_id, task_key)
);

-- ---------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists trg_achievements_updated on public.achievements;
create trigger trg_achievements_updated before update on public.achievements
  for each row execute function public.set_updated_at();
drop trigger if exists trg_resume_updated on public.resume_details;
create trigger trg_resume_updated before update on public.resume_details
  for each row execute function public.set_updated_at();
drop trigger if exists trg_checklist_updated on public.checklist_items;
create trigger trg_checklist_updated before update on public.checklist_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. Auto-create a profile row when a student signs up with Supabase Auth
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, contact_email)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 100), null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create profiles for any users that signed up before this script ran
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 9. Table privileges + Row Level Security
--    Anonymous visitors get NO direct table access. Logged-in students can
--    only touch rows where the row belongs to them (auth.uid()).
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.projects, public.achievements,
              public.resume_details, public.checklist_items from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.achievements,
      public.resume_details, public.checklist_items to authenticated;

alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.achievements    enable row level security;
alter table public.resume_details  enable row level security;
alter table public.checklist_items enable row level security;

-- profiles (the row id IS the user id)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- projects
drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all on public.projects for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- achievements
drop policy if exists achievements_owner_all on public.achievements;
create policy achievements_owner_all on public.achievements for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- resume_details
drop policy if exists resume_owner_all on public.resume_details;
create policy resume_owner_all on public.resume_details for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- checklist_items
drop policy if exists checklist_owner_all on public.checklist_items;
create policy checklist_owner_all on public.checklist_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 10. Public portfolio access (deliberately narrow)
--     The public never reads the tables. It can only call get_public_portfolio(),
--     which returns ONLY fields the student chose to publish.
-- ---------------------------------------------------------------------
create or replace function public.portfolio_json(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'username',         p.username,
    'full_name',        p.full_name,
    'headline',         p.headline,
    'intro',            p.intro,
    'college',          case when p.show_college then p.college end,
    'course',           case when p.show_college then p.course end,
    'year_of_study',    case when p.show_college then p.year_of_study end,
    'technical_skills', to_jsonb(p.technical_skills),
    'soft_skills',      to_jsonb(p.soft_skills),
    'interests',        case when p.show_interests then to_jsonb(p.interests) else '[]'::jsonb end,
    'github_url',       p.github_url,
    'linkedin_url',     p.linkedin_url,
    'website_url',      p.website_url,
    'contact_email',    case when p.show_contact_email then p.contact_email end,
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
               'title', pr.title, 'description', pr.description, 'purpose', pr.purpose,
               'technologies', to_jsonb(pr.technologies), 'category', pr.category, 'role', pr.role,
               'github_url', pr.github_url, 'live_url', pr.live_url,
               'completed_on', pr.completed_on, 'is_featured', pr.is_featured)
             order by pr.is_featured desc, pr.completed_on desc nulls last, pr.created_at desc)
      from public.projects pr where pr.user_id = p.id and pr.is_public), '[]'::jsonb),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
               'title', a.title, 'organization', a.organization, 'category', a.category,
               'earned_on', a.earned_on, 'credential_url', a.credential_url,
               'description', a.description)
             order by a.earned_on desc, a.created_at desc)
      from public.achievements a where a.user_id = p.id and a.is_public), '[]'::jsonb)
  )
  from public.profiles p
  where p.id = p_user;
$$;

create or replace function public.get_public_portfolio(p_username text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.portfolio_json(p.id)
  from public.profiles p
  where p.username = lower(p_username) and p.is_public;
$$;

create or replace function public.get_my_portfolio_preview()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.portfolio_json(auth.uid());
$$;

revoke all on function public.portfolio_json(uuid)          from public, anon, authenticated;
revoke all on function public.get_public_portfolio(text)    from public, anon, authenticated;
revoke all on function public.get_my_portfolio_preview()    from public, anon, authenticated;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;
grant execute on function public.get_my_portfolio_preview() to authenticated;

-- Done. Check: Table Editor should list profiles, projects, achievements,
-- resume_details and checklist_items, each showing "RLS enabled".
