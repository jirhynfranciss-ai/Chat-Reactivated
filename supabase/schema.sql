-- =====================================================================
-- Romantic Questionnaire & Private Chat — Supabase schema
-- Run this entire script once in the Supabase SQL Editor on a fresh
-- project. It is idempotent-ish (uses IF NOT EXISTS / ON CONFLICT where
-- practical) but is intended to be run on a clean database.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- TABLES
-- =====================================================================

-- QUESTIONS ------------------------------------------------------------
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  question_text text not null,
  question_type text not null check (question_type in ('TEXT','LONG_TEXT','SINGLE_CHOICE','MULTIPLE_CHOICE','YES_NO')),
  options jsonb,
  is_required boolean not null default true,
  is_active boolean not null default true,
  display_order integer not null default 0,
  introduction_text text,
  conditional_question_id uuid references questions(id) on delete set null,
  conditional_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_questions_updated_at on questions;
create trigger trg_questions_updated_at
  before update on questions
  for each row execute function set_updated_at();

create index if not exists idx_questions_display_order on questions(display_order);
create index if not exists idx_questions_is_active on questions(is_active);

-- RESPONSES --------------------------------------------------------------
create table if not exists responses (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_responses_user_id on responses(user_id);
create index if not exists idx_responses_session_id on responses(session_id);
create index if not exists idx_responses_created_at on responses(created_at);

-- ANSWERS ------------------------------------------------------------------
create table if not exists answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references responses(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_answers_response_id on answers(response_id);
create index if not exists idx_answers_question_id on answers(question_id);

-- PROFILES -------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- USER PREFERENCES -------------------------------------------------------
create table if not exists user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme_preference text not null default 'system' check (theme_preference in ('light','dark','system')),
  notification_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_preferences_updated_at on user_preferences;
create trigger trg_user_preferences_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();

-- CONVERSATIONS ------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_conversations_updated_at on conversations;
create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

-- CONVERSATION PARTICIPANTS ------------------------------------------------
-- unique(user_id) enforces exactly one private conversation per user,
-- preventing duplicate conversations between the same user and admin.
create table if not exists conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_participants_conversation_id on conversation_participants(conversation_id);
create index if not exists idx_participants_user_id on conversation_participants(user_id);

-- MESSAGES -------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_sender_id on messages(sender_id);
create index if not exists idx_messages_created_at on messages(created_at);

-- bump conversations.updated_at whenever a new message arrives
create or replace function touch_conversation_updated_at()
returns trigger as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_messages_touch_conversation on messages;
create trigger trg_messages_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_updated_at();

-- ADMIN USERS ------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ADMIN SETTINGS -----------------------------------------------------------
create table if not exists admin_settings (
  id uuid primary key default uuid_generate_v4(),
  site_title text not null default 'A Little Question For You',
  welcome_message text not null default 'I''ve been curious about you, so I thought I''d ask a few things.',
  final_message text not null default 'Thank you for letting me get to know you a little better.',
  theme_appearance text not null default 'auto' check (theme_appearance in ('light','dark','auto')),
  questionnaire_enabled boolean not null default true,
  allow_multiple_submissions boolean not null default false,
  account_creation_enabled boolean not null default true,
  chat_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_settings_updated_at on admin_settings;
create trigger trg_admin_settings_updated_at
  before update on admin_settings
  for each row execute function set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table questions enable row level security;
alter table responses enable row level security;
alter table answers enable row level security;
alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table admin_users enable row level security;
alter table admin_settings enable row level security;

-- Helper function: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$ language sql stable security definer;

-- QUESTIONS policies -------------------------------------------------------
drop policy if exists "Public can read active questions" on questions;
create policy "Public can read active questions"
  on questions for select
  using (is_active = true or is_admin());

drop policy if exists "Admins manage questions" on questions;
create policy "Admins manage questions"
  on questions for all
  using (is_admin())
  with check (is_admin());

-- RESPONSES policies ---------------------------------------------------
drop policy if exists "Anyone can submit a response" on responses;
create policy "Anyone can submit a response"
  on responses for insert
  with check (true);

drop policy if exists "Owners and admins can view responses" on responses;
create policy "Owners and admins can view responses"
  on responses for select
  using (auth.uid() = user_id or is_admin());

drop policy if exists "Owners can link their response" on responses;
create policy "Owners can link their response"
  on responses for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

drop policy if exists "Admins can delete responses" on responses;
create policy "Admins can delete responses"
  on responses for delete
  using (is_admin());

-- ANSWERS policies -------------------------------------------------------
drop policy if exists "Anyone can submit answers" on answers;
create policy "Anyone can submit answers"
  on answers for insert
  with check (true);

drop policy if exists "Owners and admins can view answers" on answers;
create policy "Owners and admins can view answers"
  on answers for select
  using (
    is_admin() or exists (
      select 1 from responses r
      where r.id = answers.response_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can delete answers" on answers;
create policy "Admins can delete answers"
  on answers for delete
  using (is_admin());

-- PROFILES policies ------------------------------------------------------
drop policy if exists "Users manage their own profile" on profiles;
create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

-- USER PREFERENCES policies ----------------------------------------------
drop policy if exists "Users manage their own preferences" on user_preferences;
create policy "Users manage their own preferences"
  on user_preferences for all
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

-- CONVERSATIONS policies ---------------------------------------------------
drop policy if exists "Participants and admins can view conversations" on conversations;
create policy "Participants and admins can view conversations"
  on conversations for select
  using (
    is_admin() or exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can create a conversation" on conversations;
create policy "Authenticated users can create a conversation"
  on conversations for insert
  with check (auth.uid() is not null);

drop policy if exists "Admins can update conversations" on conversations;
create policy "Admins can update conversations"
  on conversations for update
  using (is_admin() or exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
  ));

-- CONVERSATION PARTICIPANTS policies ---------------------------------------
drop policy if exists "Users see their own participation" on conversation_participants;
create policy "Users see their own participation"
  on conversation_participants for select
  using (auth.uid() = user_id or is_admin());

drop policy if exists "Users can join their own conversation" on conversation_participants;
create policy "Users can join their own conversation"
  on conversation_participants for insert
  with check (auth.uid() = user_id or is_admin());

-- MESSAGES policies -------------------------------------------------------
drop policy if exists "Participants and admins can read messages" on messages;
create policy "Participants and admins can read messages"
  on messages for select
  using (
    is_admin() or exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Participants and admins can send messages" on messages;
create policy "Participants and admins can send messages"
  on messages for insert
  with check (
    sender_id = auth.uid() and (
      is_admin() or exists (
        select 1 from conversation_participants cp
        where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Participants and admins can mark messages read" on messages;
create policy "Participants and admins can mark messages read"
  on messages for update
  using (
    is_admin() or exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

-- ADMIN USERS policies -----------------------------------------------------
drop policy if exists "Admins can view admin list" on admin_users;
create policy "Admins can view admin list"
  on admin_users for select
  using (is_admin() or auth.uid() = user_id);

-- ADMIN SETTINGS policies ---------------------------------------------------
drop policy if exists "Everyone can read settings" on admin_settings;
create policy "Everyone can read settings"
  on admin_settings for select
  using (true);

drop policy if exists "Admins can update settings" on admin_settings;
create policy "Admins can update settings"
  on admin_settings for update
  using (is_admin())
  with check (is_admin());

-- =====================================================================
-- SEED DATA
-- =====================================================================

insert into admin_settings (site_title, welcome_message, final_message)
select 'A Little Question For You', 'I''ve been curious about you, so I thought I''d ask a few things.', 'Thank you for letting me get to know you a little better.'
where not exists (select 1 from admin_settings);

-- 15 core questions, in order, with the Facebook question conditionally
-- revealing a follow-up text field.
do $$
declare
  fb_question_id uuid;
begin
  if not exists (select 1 from questions) then
    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('First things first... what''s your name?', 'TEXT', null, true, true, 1, 'I''d love to know... what should I call you?')
    returning id into fb_question_id; -- temp reuse, overwritten below

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('Okay, now that I know your name... can I have your Facebook? 👀', 'SINGLE_CHOICE',
      '["Yes, sure 💗", "Maybe later 🤍", "I don''t use Facebook"]'::jsonb, true, true, 2, null)
    returning id into fb_question_id;

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text, conditional_question_id, conditional_value)
    values ('Yesss! 😳 What''s your Facebook?', 'TEXT', null, true, true, 3,
      'Your Facebook name or profile URL...', fb_question_id, 'Yes, sure 💗');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What do your friends usually call you?', 'TEXT', null, true, true, 4, 'I''m curious what your close friends think of you...');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What''s your favorite thing to do when you''re bored?', 'SINGLE_CHOICE',
      '["Watching movies 🎬", "Listening to music 🎧", "Playing games 🎮", "Sleeping 😴", "Going out 🌎", "Scrolling social media 📱", "Other"]'::jsonb,
      true, true, 5, 'Okay, now I''m curious... 👀');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What kind of music do you usually listen to?', 'MULTIPLE_CHOICE',
      '["Pop", "R&B", "Hip-Hop", "OPM", "Indie", "Rock", "K-Pop", "Acoustic", "Classical", "Other"]'::jsonb,
      true, true, 6, 'I really want to know this one... 💭');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What''s your favorite food?', 'TEXT', null, true, true, 7, 'This tells me a lot about a person...');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('Coffee or milktea? 🧋☕', 'SINGLE_CHOICE',
      '["Coffee ☕", "Milktea 🧋", "Both", "Neither"]'::jsonb, true, true, 8, null);

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('Are you more of a stay-at-home person or an outside/adventure person?', 'SINGLE_CHOICE',
      '["Stay at home 🏠", "Going outside 🌎", "Depends on my mood 😌"]'::jsonb, true, true, 9, 'Just a few more... promise. 💗');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What''s one thing that can instantly make you happy?', 'LONG_TEXT', null, true, true, 10, 'I really want to know this one...');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What kind of person do you enjoy talking to?', 'LONG_TEXT', null, true, true, 11, 'I''m genuinely curious...');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('What''s something you really appreciate when someone does it for you?', 'LONG_TEXT', null, true, true, 12, 'This one matters to me.');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('Be honest... are you currently interested in someone? 👀', 'SINGLE_CHOICE',
      '["Yes 😳", "Maybe...", "Not right now", "It''s complicated 😅", "I''d rather not say"]'::jsonb, true, true, 13, 'Okay... be honest with me. 😳');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('If someone wanted to get to know you better, what should they know about you?', 'LONG_TEXT', null, true, true, 14, 'Take your time with this one.');

    insert into questions (question_text, question_type, options, is_required, is_active, display_order, introduction_text)
    values ('And finally... would you be okay with getting to know each other more? 👀❤️', 'SINGLE_CHOICE',
      '["Yes 💗", "Definitely!", "Maybe 😳", "Let''s see where it goes", "I''d rather stay friends"]'::jsonb, true, true, 15, 'Last one... I promise. 💌');
  end if;
end $$;

-- =====================================================================
-- MAKING YOURSELF THE ADMIN
-- =====================================================================
-- 1. Sign up for a normal account from /create-account (or Supabase Auth
--    dashboard) using the email you want to use for admin login.
-- 2. Find that user's id in Authentication -> Users.
-- 3. Run:
--    insert into admin_users (user_id) values ('<your-user-uuid>');
-- 4. Log in at /admin with that email + password.

-- =====================================================================
-- REALTIME
-- =====================================================================
-- Enable realtime replication for the messages table so chat updates
-- live. In the Supabase Dashboard: Database -> Replication -> toggle on
-- the "messages" table (and optionally "conversations").
