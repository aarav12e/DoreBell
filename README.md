# Silent Doorbell — Frontend

React (Vite) dashboard for "The Doorbell Nobody Can Hear". It listens live to a Firebase
Realtime Database written by the ESP8266 and shows a full-screen visual alert when the bell
is pressed.

## Run locally

```bash
npm install
npm run dev
```

With no `.env`, the app runs in **demo mode**: use the on-page buttons to simulate the hardware.

## Connect your database

1. Firebase console → create project → Realtime Database → start in test mode.
2. Copy `.env.example` to `.env` and set `VITE_FIREBASE_DB_URL`.
3. Restart `npm run dev`.

Data shape the ESP8266 must write:

| Path           | Value                                  |
|----------------|----------------------------------------|
| `/door/bell`   | `{ "ring": true, "ts": <timestamp ms> }` |
| `/door/state`  | `"open"` or `"closed"`                 |
| `/door/person` | `true` or `false`                      |

The website's Dismiss button sets `/door/bell/ring` to `false`.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Vercel → New Project → import the repo (Vite is auto-detected).
3. Add environment variable `VITE_FIREBASE_DB_URL`, then deploy.

The ESP8266 and the website do not need to be on the same Wi-Fi.

## Note on database rules

Test mode lets anyone with the URL read and write. Before a real deployment, restrict the
rules (for example, require auth or limit writes to `/door`).
