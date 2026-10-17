# 🔔 Silent Doorbell

**A doorbell you can see instead of hear.** An ESP8266-based visual doorbell for deaf and hard-of-hearing users (or anyone who wants quiet living), paired with a real-time React dashboard that shows alerts, door state, and visitor presence on your laptop or phone.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?logo=firebase&logoColor=black)
![ESP8266](https://img.shields.io/badge/ESP8266-NodeMCU-E7352C?logo=espressif&logoColor=white)

---

## ✨ Features

- **Full-screen visual alert** when someone rings the bell, with phone vibration and an optional chime
- **Live door state**: the dashboard animates the door opening and closing in real time
- **Visitor presence detection** via an IR proximity sensor, so you know someone is at the door before they ring
- **Physical indicators** on the device: servo flag, LED, and buzzer
- **Demo mode**: run the whole UI without any hardware or Firebase setup
- **Responsive white theme** for both mobile and desktop

---

## 🧩 How It Works

```
┌──────────────────────┐   Wi-Fi    ┌───────────────────┐   realtime   ┌──────────────────┐
│  ESP8266 + sensors   │ ─────────▶ │ Firebase Realtime │ ───────────▶ │  React dashboard │
│  (touch, LDR, IR)    │            │     Database      │ ◀─────────── │  (Vite, mobile + │
└──────────────────────┘            └───────────────────┘   dismiss    │   desktop)       │
                                                                       └──────────────────┘
```

1. **Visitor touches the bell (D5):** the ESP8266 swings the servo flag, lights the LED, and writes `/door/bell` with `ring: true`. The web app shows a full-screen alert, vibrates the phone, and can play a chime.
2. **Dismiss:** clicking **Dismiss Alert** on the website writes `/door/bell/ring = false`.
3. **Door opens:** light reaches the LDR (A0) and the dashboard shows the door swinging open.
4. **Someone approaches:** the FC-51 IR sensor (D6) detects proximity and the dashboard shows visitor presence.

---

## 🔌 Hardware

### Pinout

| Component            | ESP8266 Pin   | Firebase Path  | Behavior                                            |
| -------------------- | ------------- | -------------- | --------------------------------------------------- |
| **Touch doorbell**   | `D5` (Input)  | `/door/bell`   | Writes `{"ring": true, "ts": <timestamp>}` on touch |
| **Servo flag**       | `D4` (Output) | n/a            | Swings to 90° when the bell is pressed              |
| **LED indicator**    | `D7` (Output) | n/a            | Lights up when the bell is pressed                  |
| **Buzzer**           | `D1` (Output) | n/a            | Audio indicator                                     |
| **LDR light sensor** | `A0` (Analog) | `/door/state`  | Writes `"open"` (light) or `"closed"` (dark)        |
| **FC-51 IR sensor**  | `D6` (Input)  | `/door/person` | Writes `true` (visitor present) or `false`          |

### Parts list

- ESP8266 board (NodeMCU)
- Touch sensor module
- Servo motor
- LED + resistor
- Buzzer
- LDR + resistor (voltage divider into A0)
- FC-51 IR obstacle sensor

### Flashing the firmware

1. Install the [Arduino IDE](https://www.arduino.cc/en/software) and add the ESP8266 board package.
2. Open [`esp8266/esp8266.ino`](esp8266/esp8266.ino).
3. Set your Wi-Fi credentials and Firebase Realtime Database details in the sketch.
4. Select your board, then upload.

---

## 💻 Frontend Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/aarav12e/DoreBell.git
cd DoreBell
npm install
cp .env.example .env
npm run dev
```

Set your Firebase Realtime Database URL in `.env`:

```env
VITE_FIREBASE_DB_URL=https://YOUR-PROJECT-default-rtdb.firebaseio.com
```

> **No hardware yet?** Leave `VITE_FIREBASE_DB_URL` empty to run in **demo mode**.

### Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the Vite dev server      |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview the production build   |

### Deploying

The app is a static Vite build, so it deploys cleanly to Vercel, Netlify, or any static host. Add `VITE_FIREBASE_DB_URL` as an environment variable in your host's settings.

---

## 🗂 Project Structure

```
DoreBell/
├── esp8266/          # Arduino firmware for the ESP8266
├── src/              # React frontend
├── index.html
├── vite.config.js
├── .env.example      # Firebase DB URL template
└── package.json
```

---

## 🛠 Tech Stack

- **Firmware:** Arduino C++ on ESP8266
- **Frontend:** React 18, Vite 5
- **Backend / realtime:** Firebase Realtime Database

---

## 🔒 Firebase Notes

Your Realtime Database must allow the ESP8266 to write to `/door/*` and the web app to read it and write `/door/bell/ring`. Lock down your database rules before exposing it publicly, and never commit real credentials. `.env` is already git-ignored.

---

## 🚀 Roadmap Ideas

- Push notifications when the page is closed
- Multiple doorbells / rooms
- Ring history log
- Installable PWA

---

## 👤 Author

**Aarav Kumar**: [GitHub](https://github.com/aarav12e)
