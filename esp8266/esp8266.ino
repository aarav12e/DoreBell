#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <Servo.h>

// ==============================================================
// 1. WI-FI & FIREBASE CONFIGURATION
// ==============================================================
const char* WIFI_SSID = "nexora";
const char* WIFI_PASS = "11223344";

// Firebase Realtime Database URL
const String DB_URL   = "https://dorebell-e82a2-default-rtdb.asia-southeast1.firebasedatabase.app";
const String DB_AUTH  = ""; // Leave empty if Firebase is in test mode

// ==============================================================
// 2. HARDWARE PIN DEFINITIONS
// ==============================================================
#define TOUCH_PIN D5   // Touch Sensor (Doorbell)
#define IR_PIN    D6   // FC-51 IR Obstacle Sensor (OUT pin)
#define LED_PIN   D7   // Visual LED Alert Indicator
#define SERVO_PIN D4   // Servo Motor Flag
#define BUZZ_PIN  D1   // Active Buzzer
#define LDR_PIN   A0   // LDR Module Analog Output (AO pin)

// ==============================================================
// 3. SENSOR CALIBRATION & LOGIC
// ==============================================================
// LDR Threshold: When door opens, light enters and A0 reading changes.
// Check Serial Monitor to see your normal room reading vs door open reading!
const int LDR_THRESHOLD = 500; 

// True if light makes A0 HIGHER than threshold (default for most LDR dividers)
// If your LDR reading gets LOWER with light, change this to false.
const bool LDR_OPEN_IS_HIGHER = true; 

Servo flag;

// State tracking variables
bool lastDoorOpen   = false;
bool lastPerson     = false;
unsigned long lastTouchTime = 0;
unsigned long lastSerialLog = 0;
unsigned long alertEndTime  = 0;
bool isPhysicalAlertActive  = false;

// ==============================================================
// 4. HTTP SEND HELPER
// ==============================================================
void send(const String& path, const String& json) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  WiFiClientSecure client;
  client.setInsecure(); // SSL without certificate verification
  
  HTTPClient http;
  String fullUrl = DB_URL + path + ".json";
  if (DB_AUTH.length() > 0) {
    fullUrl += "?auth=" + DB_AUTH;
  }
  
  http.begin(client, fullUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.PUT(json);
  if (httpCode > 0) {
    Serial.printf("[HTTP] PUT %s -> code %d\n", path.c_str(), httpCode);
  } else {
    Serial.printf("[HTTP] Failed %s -> error: %s\n", path.c_str(), http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ==============================================================
// 5. PHYSICAL ALERT ACTIVATOR (LED, SERVO, BUZZER)
// ==============================================================
void triggerPhysicalAlert(int durationMs = 3000) {
  digitalWrite(LED_PIN, HIGH);
  digitalWrite(BUZZ_PIN, HIGH);
  flag.write(90); // Swing flag up
  
  alertEndTime = millis() + durationMs;
  isPhysicalAlertActive = true;
}

void checkPhysicalAlertTimer() {
  if (isPhysicalAlertActive && millis() >= alertEndTime) {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZ_PIN, LOW);
    flag.write(0); // Return flag to neutral
    isPhysicalAlertActive = false;
  }
}

// ==============================================================
// 6. SETUP
// ==============================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=============================================");
  Serial.println("  Silent Doorbell (ESP8266 + 3 Sensors)      ");
  Serial.println("  1. Touch: Pin D5                           ");
  Serial.println("  2. IR Sensor: Pin D6                       ");
  Serial.println("  3. LDR Light Sensor: Pin A0 (AO)           ");
  Serial.println("=============================================");

  pinMode(TOUCH_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZ_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZ_PIN, LOW);

  // Initialize Servo
  flag.attach(SERVO_PIN);
  flag.write(0);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\n[Wi-Fi] Connected!");
  Serial.print("[Wi-Fi] IP Address: ");
  Serial.println(WiFi.localIP());

  // Test physical actuators once on startup
  digitalWrite(LED_PIN, HIGH);
  flag.write(45);
  delay(400);
  digitalWrite(LED_PIN, LOW);
  flag.write(0);
}

// ==============================================================
// 7. MAIN LOOP (ALL 3 SENSORS ACTIVELY MONITORED)
// ==============================================================
void loop() {
  // Non-blocking timer for LED, Servo and Buzzer
  checkPhysicalAlertTimer();

  // ------------------------------------------------------------
  // SENSOR 1: Touch Doorbell (TTP223 on Pin D5)
  // ------------------------------------------------------------
  int touchVal = digitalRead(TOUCH_PIN);
  if (touchVal == HIGH && (millis() - lastTouchTime > 3500)) {
    lastTouchTime = millis();
    Serial.println("\n[EVENT 1] >>> TOUCH DOORBELL PRESSED! (Pin D5)");
    
    triggerPhysicalAlert(3000);
    
    // Notify Firebase: Bell ringing with cause="bell"
    send("/door/bell", "{\"ring\":true,\"cause\":\"bell\",\"ts\":{\".sv\":\"timestamp\"}}");
  }

  // ------------------------------------------------------------
  // SENSOR 2: FC-51 IR Obstacle Sensor (Pin D6)
  // Note: FC-51 outputs LOW (0) when obstacle is detected!
  // ------------------------------------------------------------
  int irVal = digitalRead(IR_PIN);
  bool personDetected = (irVal == LOW);
  
  if (personDetected != lastPerson) {
    lastPerson = personDetected;
    if (personDetected) {
      Serial.println("\n[EVENT 2] >>> VISITOR DETECTED BY IR SENSOR! (Pin D6)");
      triggerPhysicalAlert(2500);
      
      // Notify Firebase: Person arrived + ring visual alert
      send("/door/person", "true");
      send("/door/bell", "{\"ring\":true,\"cause\":\"person\",\"ts\":{\".sv\":\"timestamp\"}}");
    } else {
      Serial.println("[INFO] Visitor moved away from IR sensor.");
      send("/door/person", "false");
    }
  }

  // ------------------------------------------------------------
  // SENSOR 3: LDR Light Module (Analog AO on Pin A0)
  // When door opens, light enters and analog reading crosses threshold
  // ------------------------------------------------------------
  int ldrVal = analogRead(LDR_PIN);
  bool doorOpen = LDR_OPEN_IS_HIGHER ? (ldrVal > LDR_THRESHOLD) : (ldrVal < LDR_THRESHOLD);
  
  if (doorOpen != lastDoorOpen) {
    lastDoorOpen = doorOpen;
    if (doorOpen) {
      Serial.printf("\n[EVENT 3] >>> DOOR OPENED! (LDR A0: %d > Threshold: %d)\n", ldrVal, LDR_THRESHOLD);
      triggerPhysicalAlert(2000);
      
      // Notify Firebase: Door state open + trigger visual alert
      send("/door/state", "\"open\"");
      send("/door/bell", "{\"ring\":true,\"cause\":\"door\",\"ts\":{\".sv\":\"timestamp\"}}");
    } else {
      Serial.printf("[INFO] Door closed. (LDR A0: %d)\n", ldrVal);
      send("/door/state", "\"closed\"");
    }
  }

  // ------------------------------------------------------------
  // PERIODIC SERIAL MONITOR LOG (Every 1.5 seconds)
  // Look at this to calibrate your LDR and test your IR module!
  // ------------------------------------------------------------
  if (millis() - lastSerialLog > 1500) {
    lastSerialLog = millis();
    Serial.printf("[SENSORS LIVE] Touch(D5): %d | IR(D6): %d [%s] | LDR(A0): %d [%s]\n",
      touchVal,
      irVal,
      personDetected ? "DETECTED" : "CLEAR",
      ldrVal,
      doorOpen ? "OPEN" : "CLOSED"
    );
  }

  delay(20); // Smooth non-blocking polling
}
