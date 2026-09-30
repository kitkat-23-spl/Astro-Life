# Astro Life ✦

**Your birth chart, clearly explained.** Astro Life is a free astrology site where anyone can:

- enter birth details and get an **accurate natal chart**, shown as an interactive wheel with Big Three cards, element and modality balance, and trait meters;
- read a **transparent, rule-based interpretation**, where every insight shows the exact rule that produced it ("Why am I seeing this?") and links to the lesson that teaches it;
- **learn astrology** through 15 lessons from beginner to advanced, with worked examples (including a full synthesis of Einstein's chart), quizzes and saved progress;
- **sign in with Google** (Supabase Auth) to save charts privately.

## How it works

| Layer | What it does |
|---|---|
| `src/astro/` | Chart maths. [Astronomy Engine](https://github.com/cosinekitty/astronomy) gives tropical geocentric positions (±1′). Luxon converts local birth time → UTC using historical time zones. Ascendant/MC come from sidereal time + obliquity, with Placidus / Whole Sign / Equal houses (Placidus falls back to Whole Sign at polar latitudes). Also covers retrogrades, dignities, the mean node, and aspects with orbs plus applying/separating. |
| `src/interpret/` | Rules engine. Content tables (signs, planets, houses, aspect pairs) are combined by rules: Big Three, chart ruler, planet-in-sign-in-house, dignity, retrograde, aspects, stelliums, grand trines, T-squares, element/modality/hemisphere balance, nodes. Each `Insight` carries its `rule` string. |
| `src/learn/` | Curriculum as structured data (no raw HTML), rendered safely. |
| `src/lib/` | Supabase client, Google auth, geocoding (Open-Meteo, no API key), saved charts, shareable links. |

Chart calculation runs **entirely in the browser**. The engine is verified in `src/astro/__tests__` against Einstein's published chart: Sun, Moon, Ascendant, all planets and Placidus cusps match Astrodienst to within an arcminute.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine + interpretation tests
npm run build
```

The site works fully without Supabase; sign-in and saving simply stay hidden until it's configured.

## Setup: Google login with Supabase (≈10 minutes)

1. **Create a Supabase project** (free) at <https://supabase.com>.
2. **Create the database table**: open *SQL Editor*, paste [`supabase/migrations/20260930000000_charts.sql`](supabase/migrations/20260930000000_charts.sql) and run it.
3. **Google OAuth client**: in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an *OAuth client ID* (Web application).
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Configure the OAuth consent screen (app name "Astro Life", scopes: email, profile, openid).
4. **Enable Google in Supabase**: *Authentication → Sign In / Providers → Google*, paste the Client ID and Secret. (The **secret stays in Supabase only**, never in this repo.)
5. **Allow your site URL**: *Authentication → URL Configuration*:
   - Site URL: your deployed URL (e.g. `https://astro-life.pages.dev`)
   - Redirect URLs: `https://astro-life.pages.dev/**` (plus `http://localhost:5173/**` for development)
6. **Add the public keys** from *Project Settings → API*: the Project URL and the **anon / publishable** key.
   - Local: copy `.env.example` → `.env`
   - GitHub Pages: repo *Settings → Secrets and variables → Actions → Variables*: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Cloudflare Pages / Vercel: add the same two as environment variables.

> ⚠️ Never use the `service_role` key in this app. The anon key is public by design; Row Level Security is what protects the data.

## Free hosting

| Option | Free URL | Notes |
|---|---|---|
| **Cloudflare Pages** (recommended) | `astro-life.pages.dev` | Connect the repo; build `npm run build`, output `dist`. `public/_headers` adds security headers and `_redirects` handles SPA routes. |
| **Vercel** | `astrolife.vercel.app` | Import the repo; `vercel.json` sets rewrites and headers. |
| **GitHub Pages** | `kitkat-23-spl.github.io/Astro-Life` | Already wired up: *Settings → Pages → Source: GitHub Actions*, then push to `main`. (Requires a public repo on the free plan.) |

A custom domain such as `astrolife.app` can be added later on any of these.

## Security

- **Row Level Security** on `charts`: users can only select, insert or delete their own rows. `anon` has no access, `user_id` defaults to `auth.uid()`, payload size is capped, and a trigger limits accounts to 100 charts.
- **OAuth 2.0 + PKCE** via Supabase; no secrets in the frontend bundle.
- **Content Security Policy** (injected at build): scripts only from this origin; network only to Supabase and the geocoder; `object-src 'none'`. Hosting headers add `frame-ancestors 'none'`, HSTS, `nosniff` and a strict referrer policy.
- **No HTML injection surface**: all content, including lessons, renders as React text; nothing uses `dangerouslySetInnerHTML`.
- **Privacy**: birth data is computed locally, share links keep it in the `#fragment` (never sent to servers), and shared links are strictly validated. Users can delete individual charts or all of their data.
- No ads, trackers or analytics.
