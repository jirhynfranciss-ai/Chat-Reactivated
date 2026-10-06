# A Little Question For You 💌

A romantic, interactive questionnaire that turns into a private chat — built with
Vite, React, TypeScript, Tailwind CSS, Zustand, Framer Motion, and Supabase
(PostgreSQL, Auth, Realtime).

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **State:** Zustand (questionnaire progress, auth, chat)
- **Animation:** Framer Motion
- **Forms/validation:** React Hook Form + Zod
- **Backend:** Supabase (Postgres + Row Level Security, Auth, Realtime)
- **Charts:** Recharts · **CSV export:** PapaParse · **Drag & drop:** @hello-pangea/dnd
  (a maintained, React-19-compatible fork of react-beautiful-dnd, which is
  abandoned and fails to install alongside React 19)
- **Deployment:** Vercel (see `vercel.json`)

## 1. Create your Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the entire contents of `supabase/schema.sql`.
   This creates every table, index, RLS policy, trigger, and the 15 seed
   questions (including the conditional Facebook follow-up question).
3. In **Database → Replication**, enable realtime on the `messages` table.
4. Copy your **Project URL** and **anon public key** from Project Settings → API.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Never put your `service_role` key in this project — only the public anon key
is used, and all access control is enforced through Postgres Row Level
Security policies.

## 3. Make yourself an admin

1. Create an account through the site's "Create My Account" flow (or the
   Supabase Auth dashboard) using the email you want to log in with.
2. In Supabase, go to **Authentication → Users** and copy that user's UUID.
3. In the SQL Editor, run:

   ```sql
   insert into admin_users (user_id) values ('your-user-uuid-here');
   ```

4. Visit `/admin` (or press **Alt+A** anywhere on the public site) and sign in.

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Build & deploy

```bash
npm run build
```

Deploy to Vercel — `vercel.json` already configures the build command,
output directory, and SPA rewrites. Set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as Environment Variables in your Vercel project
settings (do not commit them).

## Notes

- If Supabase env vars are missing, the public questionnaire still renders
  using a local fallback question set so the UI remains explorable, but
  submissions, accounts, and chat require a configured Supabase project.
- Admin theme (light/dark) is stored independently from the public site
  theme, so an admin can browse in dark mode while visitors see light mode.
- The public site theme uses `next-themes` with `prefers-color-scheme`
  detection and localStorage persistence.
