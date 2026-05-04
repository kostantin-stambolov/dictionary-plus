# Dictionary

Mobile-first vocabulary app for building a dictionary. The first language pack is Korean to Bulgarian.

## Features

- 100 starter Korean words, grouped by category
- 10-word learning sessions
- User profile by display name
- Postgres-backed sync for progress, sessions, active word, and UI state
- Large word cards with Bulgarian translation, romanization, pictogram visual, and Korean text-to-speech
- First-level quiz: read the Korean word and type its meaning in Bulgarian
- PWA manifest and service worker for installable mobile use
- Minimal Node server for Railway

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Without `DATABASE_URL`, the app runs in local browser fallback mode. That is only for development.

## Railway With Postgres

1. Create a Railway project.
2. Add a Postgres service.
3. Add this app service from the repo.
4. In the app service, make sure `DATABASE_URL` is available from the Postgres service.
5. Deploy with:

```bash
npm start
```

`server.js` runs the schema automatically on startup. The same SQL is also in `railway-schema.sql` if you want to inspect or run it manually.

## Data Model

- `app_users`: one row per display-name profile
- `user_dictionary_state`: JSON state per user

The synced state contains:

- `progress`: known/correct/wrong counts per word
- `sessions`: saved 10-word sessions per category
- `ui`: selected category, mode, active word, and focused session state

## API

- `GET /api/health`
- `POST /api/login` with `{ "displayName": "Mira" }`
- `GET /api/state?userId=...`
- `POST /api/sync`

## Next Steps

- Replace display-name login with real auth before public launch.
- Move the word list from `app.js` into Postgres when it grows past the starter set.
- Add the full 10,000-word dictionary as separate language packs.
