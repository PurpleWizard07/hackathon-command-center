# Cloud sync setup (Supabase + Vercel)

Everything code-side is already done. These are the parts only you can do -
they all happen in a browser, no terminal needed except where noted.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login is fine).
2. **New project** - any name, a database password (generate + save one), any region.
3. Wait ~2 minutes for it to finish provisioning.

## 2. Create the table

1. In the project's left sidebar, open **SQL Editor -> New query**.
2. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repo, copy the
   whole file, paste it into the query, and click **Run**.
3. This creates one table (`hackathon_data`) with row-level security turned on,
   so each signed-in user can only ever read or write their own row.

## 3. Get your API keys

In the sidebar: **Settings -> API**. You need two values:

- **Project URL** -> `VITE_SUPABASE_URL`
- **anon / public key** -> `VITE_SUPABASE_ANON_KEY`

(The anon key is meant to be used in browser code - it's not a secret by
itself. The table's row-level security is what actually protects your data.)

## 4. Run it locally

In the project root, create a file named `.env.local` (copy `.env.example`):

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then:

```bash
npm run dev
```

You should now see a "Command Center" sign-in screen instead of the dashboard.

## 5. Allow localhost to sign in

Magic-link sign-in redirects back to a URL Supabase has to trust first.

In Supabase: **Authentication -> URL Configuration**:

- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: add `http://localhost:5173/**`

Now enter your email on the sign-in screen, click **Send sign-in link**, open
the email, click the link - it lands back on the app, signed in. The
dashboard reseeds with the sample hackathons on first sign-in (same as
local-only mode), now stored in Supabase instead of localStorage.

## 6. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) -> **Add New -> Project** -> import
   `PurpleWizard07/hackathon-command-center` from GitHub.
2. Vercel auto-detects Vite; leave the build settings as-is.
3. Before deploying, open **Environment Variables** and add the same two:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. You'll get a URL like `https://hackathon-command-center-xxxx.vercel.app`.

## 7. Allow the deployed URL to sign in

Same as step 5, but for the real domain. Back in Supabase **Authentication ->
URL Configuration**, add your Vercel URL to both fields (you can list
multiple redirect URLs, one per line):

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: also add `https://your-app.vercel.app/**`

Keep the `localhost:5173` entry too if you still want to run it locally.

That's it - open the Vercel URL on your phone and sign in with the same
email, and you'll see the same hackathons.

## Optional: lock it to just you

Right now anyone who finds your Vercel URL can enter their own email and get
their *own* empty, isolated tracker (row-level security keeps it separate
from yours, but it does let strangers create accounts). To close that off
once you've signed in yourself at least once:

**Authentication -> Sign In / Providers -> Email**, turn off **Allow new
users to sign up**. Existing accounts (yours) can still sign in as normal;
new emails will be rejected.
