# TravelPlanner

React + Vite + TypeScript travel planner with Firebase Auth/Firestore and Google Maps, deployed to GitHub Pages.

Live (after setup): `https://<your-username>.github.io/TravelPlanner/`

## Features (v1)

- Google sign-in
- Create/edit trips with daily spots and times
- Google Places search + map
- Google Routes between spots
- Budget total + expense sum (trip currency + HKD via manual rate)
- Personal wishlist + per-trip wishlist
- Read-only share links
- zh-HK / EN UI

Phase 2 (not included): collaborative editing, bill splitting.

詳細逐步設定請睇 [SETUP.md](SETUP.md)（GitHub repo → Firebase → Maps API → `.env`／Secrets）。

## Prerequisites

1. **GitHub repo** named `TravelPlanner` (Vite `base` is `/TravelPlanner/`)
2. **Firebase** (Spark): enable Google Authentication + Firestore
3. **Google Cloud** (linked to Firebase): enable
   - Maps JavaScript API
   - Places API
   - Routes API
4. Restrict the Maps API key HTTP referrers to:
   - `http://localhost:*`
   - `https://<your-username>.github.io/TravelPlanner/*`

## Local setup


```bash
npm install
cp .env.example .env
# fill VITE_* values
npm run dev
```

### Firebase console checklist

- Authentication → Sign-in method → Google → Enable
- Authentication → Settings → Authorized domains → add `localhost` and `<your-username>.github.io`
- Firestore → Create database → paste rules from [`firestore.rules`](firestore.rules)

### `.env` keys

See [`.env.example`](.env.example). Get Firebase web config from Project settings → Your apps.

## Deploy to GitHub Pages

1. Push this repo to GitHub (`main` or `master`)
2. Repo → Settings → Pages → Source: **GitHub Actions**
3. Repo → Settings → Secrets and variables → Actions → add all `VITE_*` secrets from `.env.example`
4. Push to `main`/`master` (or run the **Deploy to GitHub Pages** workflow manually)

The workflow builds the app and publishes `dist` (plus `404.html` for SPA routes).

## Share links

After enabling share on a trip, the link looks like:

`https://<your-username>.github.io/TravelPlanner/share/<shareId>`

Anyone with the link can read the trip; only the owner can edit.

## Notes

- No Python backend; math (budget totals, HKD conversion) runs in TypeScript.
- Maps/Routes usage is billed by Google Cloud (separate from Firebase Spark free tier).
- Exchange rate is a manual `hkdRate` field on each trip (1 trip currency = N HKD).
