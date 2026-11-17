# Coy Discover

A mobile-first, privacy-first swipe discovery demo with a React frontend and a small Express API.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/feed`, `/swipe`, and `/matches` to the Express API at port `3001`. Use the X and heart buttons on desktop, or drag a profile card left and right on touch or pointer devices. Arrow keys also pass and like profiles while Discover is open.

To create a production build and serve it with Express:

```sh
npm run build
npm start
```

Swipes and mutual matches are stored in `server/data/state.json` and persist across reloads and server restarts. That generated state file is ignored by Git. Remove it while the server is stopped to reset the demo. Four mock profiles have seeded inbound likes; those likes are never returned by the API or shown unless the logged-in demo user likes the same profile.

## API

- `GET /feed` returns profiles that have not been swiped on.
- `POST /swipe` accepts `{ "profileId": "p03", "action": "like" }` or `"pass"` and reports whether a mutual match was created.
- `GET /matches` returns mutual matches only.

Run API and persistence tests with `npm test`.
