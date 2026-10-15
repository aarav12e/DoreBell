# Silent Doorbell — ESP8266 + React

A silent, accessible visual doorbell system for deaf and quiet living.

The ESP8266 writes sensor data to Firebase Realtime Database over Wi-Fi, and this React frontend displays real-time visual alerts and telemetry on your laptop or mobile phone.

---

## Hardware Pinout (ESP8266)

The firmware code is saved in [`esp8266/esp8266.ino`](./esp8266/esp8266.ino):

| Component | ESP8266 Pin | Firebase Path | Behavior |
|-----------|-------------|---------------|----------|
| **Touch Doorbell** | `D5` (Input) | `/door/bell` | Writes `{"ring": true, "ts": <timestamp>}` on touch |
| **Servo Flag** | `D4` (Output) | — | Swings to 90° when bell is pressed |
| **LED Indicator** | `D7` (Output) | — | Lights up when bell is pressed |
| **Buzzer** | `D1` (Output) | — | Audio indicator |
| **LDR Light Sensor** | `A0` (Analog) | `/door/state` | Writes `"open"` (light) or `"closed"` (dark) |
| **FC-51 IR Sensor** | `D6` (Input) | `/door/person` | Writes `true` (visitor present) or `false` |

---

## How It Works

1. When a visitor touches the **Touch Sensor (D5)**:
   - The ESP8266 triggers the servo flag, lights the LED, and writes `/door/bell` with `ring: true`.
   - The web app displays a **full-screen accessible visual alert**, vibrates the mobile phone, and plays an optional chime.
   - Clicking **"Dismiss Alert"** on the website writes `/door/bell/ring = false`.
2. When the door opens:
   - Light hits the **LDR (A0)**, and the website shows the door swinging open in real time.
3. When someone approaches:
   - The **FC-51 IR sensor (D6)** detects obstacle proximity, showing visitor presence on the website.

---

## Frontend Setup

```bash
npm install
npm run dev
```

Set your Firebase database URL in `.env`:

```env
VITE_FIREBASE_DB_URL=https://YOUR-PROJECT-default-rtdb.firebaseio.com
```

The frontend runs with a clean **White Theme**, responsive for both mobile phones and laptop screens!
