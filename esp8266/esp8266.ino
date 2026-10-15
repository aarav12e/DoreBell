#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <Servo.h>

// ---- CHANGE THESE ----
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const String DB_URL   = "https://YOUR-PROJECT-default-rtdb.firebaseio.com";
const String DB_AUTH  = "YOUR_DB_SECRET";
const int LDR_THRESHOLD = 600;   // calibrate with Serial output
// -----------------------

#define TOUCH_PIN D5
#define IR_PIN    D6
#define LED_PIN   D7
#define SERVO_PIN D4
#define BUZZ_PIN  D1   // moved off D3 (boot pin)

Servo flag;
bool lastDoorOpen = false;
unsigned long lastBell = 0;

void send(const String& path, const String& json) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();                      // fine for prototype
  HTTPClient http;
  http.begin(client, DB_URL + path + ".json?auth=" + DB_AUTH);
  http.addHeader("Content-Type", "application/json");
  http.PUT(json);
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(TOUCH_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZ_PIN, OUTPUT);
  flag.attach(SERVO_PIN);
  flag.write(0);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1) Doorbell: touch pressed (debounce 3 s)
  if (digitalRead(TOUCH_PIN) == HIGH && millis() - lastBell > 3000) {
    lastBell = millis();
    digitalWrite(LED_PIN, HIGH);
    flag.write(90);
    send("/door/bell", "{\"ring\":true,\"ts\":{\".sv\":\"timestamp\"}}");
    delay(3000);
    digitalWrite(LED_PIN, LOW);
    flag.write(0);
  }

  // 2) Door open/closed via LDR (light enters when open)
  int ldr = analogRead(A0);
  bool doorOpen = ldr > LDR_THRESHOLD;
  if (doorOpen != lastDoorOpen) {
    lastDoorOpen = doorOpen;
    send("/door/state", doorOpen ? "\"open\"" : "\"closed\"");
  }

  // 3) Person at door via IR (FC-51 outputs LOW when detected)
  static bool lastPerson = false;
  bool person = digitalRead(IR_PIN) == LOW;
  if (person != lastPerson) {
    lastPerson = person;
    send("/door/person", person ? "true" : "false");
  }

  delay(100);
}
