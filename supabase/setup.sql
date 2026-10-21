/* =============================================================
   PORTFOLIO — SUPABASE SETUP (একবারই চালাতে হবে)

   কীভাবে চালাবেন:
   1. Supabase Dashboard → SQL Editor → "New query"
      (সরাসরি খুলতে: https://supabase.com/dashboard/project/bhhrhatiipaqqyecalzj/sql/new )
   2. নিচের পুরো code copy করে paste করুন
   3. "Run" চাপুন — "Success. No rows returned" দেখলেই শেষ
   4. এরপর admin login দিয়ে ঢুকুন:  /admin.html
   ============================================================= */

-- ========== 1. TABLES ==========

create table if not exists public.profile (
  id               int primary key check (id = 1),
  site_title       text default '',
  hello            text default 'Hello',
  name             text default 'Md Sajib Sheikh',
  profession       text default 'Senior Graphic Designer',
  hero_desc        text default '',
  avatar           text default 'MS',
  about_heading    text default '',
  about_p1         text default '',
  about_p2         text default '',
  exp_years        text default '5+',
  about_name       text default '',
  about_email      text default '',
  about_location   text default '',
  about_status     text default '',
  cv_url           text default '#',
  facebook         text default '#',
  instagram        text default '#',
  linkedin         text default '#',
  twitter          text default '#',
  contact_heading  text default '',
  contact_sub      text default '',
  contact_email    text default '',
  contact_location text default '',
  contact_socials  text default '',
  footer_text      text default 'All rights reserved.',
  updated_at       timestamptz default now()
);

create table if not exists public.stats (
  id    uuid primary key default gen_random_uuid(),
  num   int not null default 0,
  label text default '',
  sort  int not null default 0
);

create table if not exists public.services (
  id    uuid primary key default gen_random_uuid(),
  icon  text default '🎨',
  title text default '',
  tags  text[] default '{}',
  sort  int not null default 0
);

create table if not exists public.tools (
  id   uuid primary key default gen_random_uuid(),
  name text default '',
  sort int not null default 0
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  emoji       text default '🎨',
  title       text default '',
  description text default '',
  tags        text[] default '{}',
  view_url    text default '#',
  case_url    text default '#',
  variant     int not null default 0,
  sort        int not null default 0
);

create table if not exists public.experience (
  id          uuid primary key default gen_random_uuid(),
  date_label  text default '',
  title       text default '',
  description text default '',
  sort        int not null default 0
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text default '',
  email      text default '',
  subject    text default '',
  message    text default '',
  created_at timestamptz not null default now()
);


-- ========== 2. SEED DATA (শুধু টেবিল খালি থাকলেই বসবে) ==========

insert into public.profile (id, site_title, hello, name, profession, hero_desc, avatar,
  about_heading, about_p1, about_p2, exp_years,
  about_name, about_email, about_location, about_status, cv_url,
  facebook, instagram, linkedin, twitter,
  contact_heading, contact_sub, contact_email, contact_location, contact_socials, footer_text)
select 1,
  'Md Sajib Sheikh | Graphic Designer',
  'Hello',
  'Md Sajib Sheikh',
  'Senior Graphic Designer',
  'I''m a creative designer based in Bangladesh, and I''m very passionate and dedicated to my work.',
  'MS',
  'A creative designer from 🇧🇩 Bangladesh',
  'I''m a graphic designer with 5+ years of hands-on experience creating designs that grab attention and drive results. From social media creatives to YouTube thumbnails and packaging, I blend creativity with strategy.',
  'I''ve helped brands, creators, and businesses stand out with designs that not only look great but also perform — more clicks, more engagement, more sales.',
  '5+',
  'Md Sajib Sheikh',
  'hello@example.com',
  'Bangladesh',
  'Open to work',
  '#',
  '#', '#', 'https://linkedin.com', 'https://twitter.com',
  'Let''s work on your next design',
  'I''m always open to new projects and creative collaborations.',
  'hello@example.com',
  'Dhaka, Bangladesh',
  'GitHub · LinkedIn · Twitter',
  'Md Sajib Sheikh. All rights reserved.'
where not exists (select 1 from public.profile);

insert into public.stats (num, label, sort)
select v.num, v.label, v.sort
from (values
  (500, 'Projects', 1),
  (120, 'Happy Clients', 2),
  (5,   'Years Exp.', 3)
) as v(num, label, sort)
where not exists (select 1 from public.stats);

insert into public.services (icon, title, tags, sort)
select v.icon, v.title, v.tags, v.sort
from (values
  ('📱', 'Social Media Design',
   array['Facebook Posts','Instagram Creatives','Reels Covers','Story Design','Ad Banners','Event Covers'], 1),
  ('▶️', 'YouTube Design',
   array['Thumbnails','Channel Art','Banner Design','End Screens','Logo / Intro','Shorts Cover'], 2),
  ('📦', 'Packaging & Branding',
   array['Packaging Design','Label Design','Logo Design','Brand Identity','Product Mockup','Print Design'], 3)
) as v(icon, title, tags, sort)
where not exists (select 1 from public.services);

insert into public.tools (name, sort)
select v.name, v.sort
from (values
  ('Adobe Photoshop', 1),
  ('Adobe Illustrator', 2),
  ('CorelDRAW', 3),
  ('Adobe After Effects', 4),
  ('Adobe Premiere Pro', 5),
  ('Figma', 6),
  ('Canva', 7)
) as v(name, sort)
where not exists (select 1 from public.tools);

insert into public.projects (emoji, title, description, tags, view_url, case_url, variant, sort)
select v.emoji, v.title, v.description, v.tags, '#', '#', v.variant, v.sort
from (values
  ('▶️', 'YouTube Thumbnails',
   'High-CTR thumbnails with bold text, vivid colors, and scroll-stopping compositions.',
   array['Photoshop','CTR Focused','A/B Variants'], 0, 1),
  ('📱', 'Social Media Campaign',
   'Complete social kits — posts, stories, and ad creatives that boost engagement.',
   array['Facebook','Instagram','Ad Creatives'], 1, 2),
  ('📦', 'Packaging Design',
   'Shelf-ready packaging and labels that build trust and drive product sales.',
   array['Packaging','Labels','Print Ready'], 2, 3),
  ('🎯', 'Brand Identity',
   'Logos and complete brand systems with colors, fonts, and usage guidelines.',
   array['Logo','Brand Guide','Identity'], 3, 4)
) as v(emoji, title, description, tags, variant, sort)
where not exists (select 1 from public.projects);

insert into public.experience (date_label, title, description, sort)
select v.date_label, v.title, v.description, v.sort
from (values
  ('2021 — Present', 'Senior Graphic Designer · Freelance',
   'Creating social media designs, YouTube thumbnails, and packaging for global clients.', 1),
  ('2019 — 2021', 'Graphic Designer · Creative Agency',
   'Designed ad campaigns, branding materials, and product packaging for brands.', 2),
  ('2015 — 2019', 'Diploma in Graphic Design',
   'Focused on visual communication, typography, and print & digital media.', 3)
) as v(date_label, title, description, sort)
where not exists (select 1 from public.experience);


-- ========== 3. SECURITY (Row Level Security) ==========
--    সবাই content পড়তে পারবে, লেখা/বদলানো শুধু লগইন করা অ্যাডমিন পারবে
--    Contact form-এর message পাঠানো যাবে, পড়া যাবে শুধু অ্যাডমিন

do $$
declare t text;
begin
  foreach t in array array['profile','stats','services','tools','projects','experience'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;

  execute 'alter table public.messages enable row level security';
  execute 'drop policy if exists "anyone can send" on public.messages';
  execute 'create policy "anyone can send" on public.messages for insert with check (true)';
  execute 'drop policy if exists "admin reads messages" on public.messages';
  execute 'create policy "admin reads messages" on public.messages for select to authenticated using (true)';
  execute 'drop policy if exists "admin deletes messages" on public.messages';
  execute 'create policy "admin deletes messages" on public.messages for delete to authenticated using (true)';
end $$;
