# Astro Life

Astro Life is a free Vedic astrology site. Every reading comes from a fixed classical rule, and every card lists the planetary combinations that produced it.

- **Kundali**: North or South Indian charts and 19 divisional charts (D1 to D60), organised in tabs:
  - *Planets*: positions, Shadbala, Vimsopaka bala and avasthas.
  - *Houses*: lords and Bhava bala, Bhava Chalit (Sripati) and KP cusps with sign, star and sub lords.
  - *Ashtakavarga*: the seven planet tables and the Sarvashtakavarga.
  - *Dasha*: Vimshottari (four levels), Yogini, Ashtottari and Chara dasha, with the houses each running period activates.
  - *Transits*: natal and transit chart, a gochara scorecard with vedha and Ashtakavarga, a 12-month outlook, upcoming sign changes and stations, and Sade Sati.
  - *Special points*: Sudarshan Chakra, Bhava/Hora/Ghati/Sree lagnas, Pranapada, Gulika, Indu lagna, all twelve arudhas, Yogi and Avayogi, Pushkara, 64th navamsa and 22nd drekkana.
- **Annual chart**: Varshaphal (muntha, the five office bearers, year lord, sahams, Mudda dasha) and Tithi Pravesh for any year.
- **Yogas**: a catalogue of 80+ classical yogas (Pancha Mahapurusha, Raja, Dhana, solar and lunar, Nabhasa, doshas). The Yogas tab shows the ones present and, on request, the ones checked and not present.
- **Life-area reports**: Career, Marriage, Wealth, Education and Children. Each report scores its rules, lists every rule (fired or not), rates the relevant divisional charts and gives dasha and double-transit timing.
- **Panchang**: tithi, vara, nakshatra, yoga, karana, lunar month, sunrise and moonrise, Rahu Kaal, Yamaganda, Gulika, Abhijit, Choghadiya and Hora for any place and date.
- **Kundali matching**: 36-point Ashtakoota, ten South Indian poruthams, Mangal dosha for both partners and chart-level checks.
- **Settings**: Lahiri, True Chitra, KP or Raman ayanamsa; mean or true nodes; 7 or 8 chara karakas; chart style.
- **Western chart**: tropical wheel with aspects, as an alternative view.
- **Learn**: a 19-lesson Jyotish course and a 15-lesson Western track with worked examples and quizzes.
- **Google sign-in** (Supabase) to save charts privately.

## Code layout

| Path | Contents |
|---|---|
| `src/astro/` | Ephemeris (Astronomy Engine), time zones (Luxon), ascendant and house systems. |
| `src/vedic/sidereal.ts` | Ayanamsas, mean and true nodes, sidereal chart, dignities, nakshatras, divisional charts. |
| `src/vedic/varga.ts`, `dasha.ts` | Divisional-chart rules (BPHS ch. 6); Vimshottari, Yogini, Ashtottari and Chara dashas. |
| `src/vedic/strength.ts`, `ashtakavarga.ts` | Shadbala, Bhava bala, Vimsopaka, avasthas; Ashtakavarga. |
| `src/vedic/transits.ts` | Gochara scorecard, monthly outlook, transit events, Sade Sati, double transits. |
| `src/vedic/jaimini.ts`, `special.ts`, `kp.ts` | Chara karakas and arudhas; special lagnas and points; KP cusps and Bhava Chalit. |
| `src/vedic/annual.ts` | Varshaphal and Tithi Pravesh. |
| `src/vedic/query.ts` | Shared chart queries: lords, occupants, drishti, sambandha, dignity scores. |
| `src/vedic/yogas.ts` | The yoga catalogue and Mangal dosha. |
| `src/vedic/rules.ts` | Rule framework shared by all reports: rule results, scoring, evidence, divisional verdicts, timing. |
| `src/vedic/career.ts`, `marriage.ts`, `wealth.ts`, `education.ts`, `children.ts` | Life-area reports. |
| `src/vedic/matching.ts`, `panchang.ts` | Kundali matching and Panchang. |
| `src/vedic/interpret.ts` | Kundali readings (planets, houses, vargas, dasha). |
| `src/interpret/` | Western rules engine. |
| `src/learn/` | Lessons as structured data. |
| `src/lib/` | Supabase, auth, settings, geocoding, saved charts, share links. |

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
   - Site URL: your deployed URL (e.g. `https://astro-life.<your-subdomain>.workers.dev`)
   - Redirect URLs: the same address followed by `/**` (plus `http://localhost:5173/**` for development)
6. **Add the public keys** from *Project Settings → API*: the Project URL and the **anon / publishable** key.
   - Local: copy `.env.example` → `.env`
   - Cloudflare: project *Settings → Build → Variables and secrets*: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

> Never use the `service_role` key in this app. The anon key is public by design; Row Level Security is what protects the data.

## Free hosting

**Cloudflare (main site).** Free, with a global CDN, HTTPS and real response headers. Cloudflare now sets new Git projects up as Workers with static assets; `wrangler.jsonc` in this repo tells it to serve `dist` and to send unknown paths to `index.html`.

1. Sign in at <https://dash.cloudflare.com> → *Workers & Pages → Create → Import a repository* and pick this repository.
2. Project name: `astro-life` (it must match `name` in `wrangler.jsonc`). Build command `npm run build`, deploy command `npx wrangler deploy`, path `/`.
3. Build variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key only). Vite reads them at build time, so they belong under *Build → Variables and secrets*, not the Worker's runtime variables.
4. Deploy. Every push to `main` redeploys. The site is at `https://astro-life.<your-subdomain>.workers.dev`.
5. In Supabase *Authentication → URL Configuration*, set the Site URL to the new address and add `https://astro-life.<your-subdomain>.workers.dev/**` to the Redirect URLs.

`public/_headers` adds the security headers.

A custom domain (for example a `.com` or `.in`, about ₹500 to ₹1,000 a year) can be added later under the project's *Settings → Domains & Routes*; Cloudflare issues the certificate.

**Checks.** `.github/workflows/ci.yml` runs the tests and a build on every push and pull request. It does not deploy.

## Security

- **Row Level Security** on `charts`: users can only select, insert or delete their own rows. `anon` has no access, `user_id` defaults to `auth.uid()`, payload size is capped, and a trigger limits accounts to 100 charts.
- **OAuth 2.0 + PKCE** via Supabase; no secrets in the frontend bundle.
- **Content Security Policy** (injected at build): scripts only from this origin; network only to Supabase and the geocoder; `object-src 'none'`. It is delivered as a meta tag so it works on both hosts; on Cloudflare Pages `public/_headers` adds frame, MIME-sniffing, referrer, permissions and HSTS headers.
- **No HTML injection surface**: all content, including lessons, renders as React text; nothing uses `dangerouslySetInnerHTML`.
- **Privacy**: birth data is computed locally, share links keep it in the `#fragment` (never sent to servers), and shared links are strictly validated. Users can delete individual charts or all of their data.
- No ads, trackers or analytics.
