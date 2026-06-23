# BeatSwipe

TikTok-style beat discovery for artists and producers. Swipe through beats, listen with live waveforms, download, and message producers directly — optimised for mobile.

## Features

- **Swipe feed** — Vertical snap-scroll feed with auto-play and double-tap to like
- **Live waveform** — Tap the waveform to seek to any point in the track
- **Discover** — Search beats by title/genre and find producers by name
- **Messaging** — Realtime DMs with file/audio sharing
- **Upload** — Upload beats with cover art, background video loop, BPM, key, and genre tags
- **Profile** — Instagram-style beat grid; tap any tile to preview with playback
- **Edit profile** — Update display name, bio, and profile photo
- **Analytics** — Plays, likes, and download counts on your own profile
- **PWA-ready** — Safe-area support for notch/home-bar devices (iPhone, Android)

## Stack

- **Next.js 15** (App Router + TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** (dark neon theme)
- **Framer Motion** (animations)
- **WaveSurfer.js v7** (animated waveforms with seek)
- **Supabase** (auth, Postgres, storage, realtime)
- **Vercel** (deployment)

---

## Setup (5 steps)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 3. Run the database migration

In the Supabase dashboard → SQL Editor, paste and run the contents of:

```
supabase/migrations/001_initial.sql
```

### 4. Configure storage buckets

In Supabase → Storage, create these **public** buckets:
- `beats-audio`
- `beats-cover`
- `beats-video`
- `avatars`

And one **private** bucket:
- `message-files`

### 5. Enable Google OAuth (optional)

In Supabase → Authentication → Providers → Google:
- Add your Google OAuth credentials
- Set redirect URL to `https://your-domain.com/auth/callback`

---

## Running locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

The feed falls back to 5 demo beats if Supabase isn't connected yet, so the UI is explorable immediately.

---

## Deploying to Vercel

```bash
npx vercel
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables
```

---

## Key files

| File | Purpose |
|---|---|
| `components/feed/BeatCard.tsx` | The core swipeable beat card |
| `components/feed/BeatFeed.tsx` | Scroll-snap vertical feed container |
| `components/audio/WaveformPlayer.tsx` | WaveSurfer.js animated waveform |
| `components/audio/AudioProvider.tsx` | Global audio singleton context |
| `components/upload/UploadForm.tsx` | Producer beat upload |
| `components/messages/ChatWindow.tsx` | Realtime DM chat |
| `hooks/useInteraction.ts` | Like/dislike/download with optimistic UI |
| `hooks/useSwipeFeed.ts` | IntersectionObserver active card tracking |
| `proxy.ts` | Auth protection for all app routes |
| `supabase/migrations/001_initial.sql` | Full database schema |
| `lib/seed-data.ts` | Demo beats for dev without Supabase |
