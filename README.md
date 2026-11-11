# GC TAKES THE DESERT · Coachella 2027

The group chat's Coachella 2027 HQ. Everyone opens one link, grabs a pass, picks their most-wanted artist, votes Weekend 1 vs Weekend 2, and drops Airbnb links. Everything is shared and live, and nobody makes an account.

**Stack:** React + Vite, Tailwind CSS, Framer Motion, Lucide icons, Supabase (database + live updates), one Vercel Function for link previews.

---

## Put it online (about 15 minutes, all free)

You need three free accounts: **GitHub**, **Supabase** and **Vercel**.

### 1. Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New project**. Any name (e.g. `gc-coachella-27`), set a database password (you won't need it again), pick the region closest to your group (e.g. West US).
2. When the project is ready, open **SQL Editor** → **New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy **all** of it, paste it in, and click **Run**. You should see "Success. No rows returned".
4. Open **Project Settings → API** (or click **Connect** at the top) and copy two values:
   - **Project URL**, which looks like `https://abcdefgh.supabase.co`
   - **anon public** key (under "Legacy API keys"), or the **publishable** key (`sb_publishable_…`). Either one works.

   These are safe to put in a website. The database only allows the actions in `schema.sql`.

### 2. Put the code on GitHub

If the code isn't on GitHub yet:

1. Create a new **private** repo at [github.com/new](https://github.com/new), for example `gc-takes-the-desert`. Don't add a README.
2. From this project folder:

```bash
git init && git add -A && git commit -m "GC takes the desert"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR-USERNAME/gc-takes-the-desert.git
```

```bash
git push -u origin main
```

### 3. Deploy (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo. Vercel detects **Vite** on its own; leave the build settings alone.
2. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon / publishable key |

3. Click **Deploy**. In about a minute you get a URL like `https://gc-takes-the-desert.vercel.app`.
4. Optional: **Settings → Domains** lets you change it to something like `gc-desert.vercel.app`.

### 4. Send it to the group chat

Paste the Vercel URL into the chat. The link preview shows the poster image (`public/og.png`).

> Changed an environment variable later? Go to **Deployments → ⋯ → Redeploy**. `VITE_` variables are baked in at build time.

---

## Run it on your computer (optional)

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in the two values in `.env.local`, then:

```bash
npm run dev
```

Open http://localhost:5173. Link previews work locally too.

---

## Things you might want to change

All in [`src/config.js`](src/config.js):

- **Countdown:** both weekends' dates are there (Apr 9–11 and Apr 16–18, 2027, as announced). The countdown follows whichever weekend is winning the Weekend War. Set `COUNTDOWN_WEEKEND = 1` (or `2`) to lock it once you decide. Gate times aren't announced, so the countdown uses noon Pacific; edit `start` if you want a different time.
- **Scrapbook photos:** the scrapbook uses drawn "disposable camera" scenes. After the trip, drop real photos in `public/memories/` and set `src: "/memories/your-photo.jpg"` on an entry.

---

## How it works

**No accounts.** The first time someone opens the site, their phone gets a random token, saved in the browser. When they print a pass, the database links that token to their pass. Everything they do later (votes, hearts, houses) checks that token.

**Protection against duplicates:**

- One pass per name (case and spaces don't matter: "brayden" = "Brayden ").
- If a name is taken (someone on a new phone or a cleared browser), the site asks "Is that you on a new phone?" and moves their pass to the new phone if they confirm.
- One weekend vote per pass. Voting again switches sides.
- One heart per house per pass. Tapping again removes it.
- The same listing can't be added twice (`airbnb.com/rooms/123?check_in=…` and `airbnb.com/rooms/123` count as the same).
- Only the person who added a house can remove it from the site.
- Limits: 200 passes, 100 houses, length limits on every text field.

This is built for a trusting friend group, not for strangers. Anyone with the link can join, and someone who clears their browser and confirms "that's me" can take over a pass with that name.

**Database tables** (`supabase/schema.sql`):

| Table | What's in it |
| --- | --- |
| `attendees` | name, status (`in` / `maybe`) |
| `attendee_devices` | private: which phone token belongs to which pass. The site can never read it. |
| `artist_picks` | each person's most-wanted artist (merged case-insensitively for the chart) |
| `weekend_votes` | each person's weekend (1 or 2) |
| `properties` | house link, nickname, total price, guests, preview title and image, who added it |
| `property_votes` | hearts: one row per person per house |

The site can read every table except `attendee_devices`, and it can't write to any table directly. All writes go through database functions (`join_trip`, `vote_weekend`, `add_property`, `toggle_property_vote`, `remove_property`) that check the phone token.

**Live updates.** Every open phone gets a signal through Supabase Realtime whenever anything changes, and refreshes its data. Phones also refresh when the app comes back to the foreground, and every 30 seconds as a backup.

**Link previews.** When someone adds a house, `api/preview.js` (a Vercel Function) fetches the listing page on the server and reads its title and preview image. Airbnb and other sites sometimes block this; when they do, the card shows a drawn desert house instead and everything else works. The function refuses private and local addresses.

---

## Admin: cleaning up

Use the Supabase dashboard → **Table Editor**:

- **Remove a person:** delete their row in `attendees`. Their artist pick, weekend vote and hearts are removed with it.
- **Remove a house:** delete the row in `properties`.
- **Start over:** run `delete from properties; delete from attendees;` in the SQL Editor.

> Free Supabase projects pause after a week with no visits. If the site says the roster didn't load, open your Supabase dashboard and click **Restore project**.

---

## Easter eggs

- Tap the sun five times.
- On a keyboard, type `desert` anywhere on the page (or the Konami code).
- Tap any pass on the roster to flip it.

---

## Project layout

```
api/preview.js           link preview function (Vercel)
supabase/schema.sql      the whole database: tables, access rules, functions
src/config.js            dates, countdown, scrapbook photos
src/lib/trip.jsx         loads data, live updates, all actions
src/lib/device.js        the per-phone token
src/components/          one file per section + shared UI (ui.jsx)
  Hero, JoinDesk, PassCard, Roster, MostWanted, WeekendWar,
  TheCrib, TripStatus, Countdown, Memories, Footer,
  Scene (drawn photos), Cursor, Intro, StickyJoin, EasterEggs
```

Not affiliated with Coachella or Goldenvoice.
