/* =============================================================
   SETTINGS TABLE — site-এর সব label/title/button text
   SQL Editor-এ paste করে Run দিন
   ============================================================= */

create table if not exists public.settings (
  key   text primary key,
  value text default ''
);

insert into public.settings (key, value) values
  ('nav_logo',             'Sajib'),
  ('nav_home',             'Home'),
  ('nav_about',            'About'),
  ('nav_services',         'Services'),
  ('nav_work',             'Work'),
  ('nav_experience',       'Experience'),
  ('nav_contact',          'Contact'),
  ('nav_cv',               'Download CV'),
  ('hero_btn_about',       'About Me'),
  ('about_eyebrow',        'Get to know me'),
  ('about_title',          'About'),
  ('about_title_accent',   'Me'),
  ('badge_years_label',    'Years<br/>Experience'),
  ('about_cv',             'Download CV'),
  ('info_label_name',      'Name'),
  ('info_label_email',     'Email'),
  ('info_label_location',  'Location'),
  ('info_label_status',    'Status'),
  ('services_eyebrow',     'What I do'),
  ('services_title',       'My'),
  ('services_title_accent','Services'),
  ('tools_label',          'Tools I use:'),
  ('work_eyebrow',         'My recent work'),
  ('work_title',           'Featured'),
  ('work_title_accent',    'Work'),
  ('project_btn_view',     'View Samples'),
  ('project_btn_case',     'Case Study'),
  ('exp_eyebrow',          'My journey'),
  ('exp_title',            'Experience &'),
  ('exp_title_accent',     'Education'),
  ('contact_eyebrow',      'Say hello'),
  ('contact_title',        'Get In'),
  ('contact_title_accent', 'Touch'),
  ('contact_item_email',   'Email'),
  ('contact_item_location','Location'),
  ('contact_item_socials', 'Socials'),
  ('form_name_label',      'Name'),
  ('form_name_ph',         'Your name'),
  ('form_email_label',     'Email'),
  ('form_email_ph',        'your@email.com'),
  ('form_subject_label',   'Subject'),
  ('form_subject_ph',      'Design project inquiry'),
  ('form_message_label',   'Message'),
  ('form_message_ph',      'Tell me about your design project...'),
  ('form_submit',          'Send Message ✉️')
on conflict (key) do nothing;

-- security: সবাই পড়তে পারবে, লেখা শুধু অ্যাডমিন
alter table public.settings enable row level security;
drop policy if exists "public read" on public.settings;
create policy "public read" on public.settings for select using (true);
drop policy if exists "admin write" on public.settings;
create policy "admin write" on public.settings for all to authenticated using (true) with check (true);
