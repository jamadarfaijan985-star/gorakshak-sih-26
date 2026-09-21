 /*MPU6500:
      SDA -> D2
      SCL -> D1

  DS18B20:
      DATA -> D5
      4.7k resistor DATA -> 3.3V

  DHT11:
      DATA -> D7

  MAX4466:
      OUT -> A0

  RED LED:
      D6 -> 330 ohm -> LED -> GND

  IMPORTANT:
  Risk score is only a prototype/demo calculation.
  It is NOT a clinical mastitis diagnosis.
*/

// ============================================================
// LIBRARIES
// ============================================================

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================================
// WIFI + MQTT CONFIGURATION
// ============================================================

// YOUR CURRENT WIFI
const char* WIFI_SSID = "Faijan";
const char* WIFI_PASSWORD = "123456789";

// YOUR LAPTOP CURRENT IPv4 ADDRESS
const char* MQTT_HOST = "10.250.43.53";

// MOSQUITTO CONFIGURED PORT
const int MQTT_PORT = 1884;

// Anonymous MQTT because your Mosquitto config uses:
// allow_anonymous true
const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";

// DEVICE ID
const char* DEVICE_ID = "ESP8266-COW-001";

// MQTT TOPIC
const char* MQTT_TOPIC =
  "godrishti/ESP8266-COW-001/sensors";

// ============================================================
// PIN DEFINITIONS
// ============================================================

#define MPU_SDA D2
#define MPU_SCL D1

#define DS18B20_PIN D5

#define DHT_PIN D7

#define DHT_TYPE DHT11

#define MIC_PIN A0

#define LED_PIN D6

// ============================================================
// OBJECTS
// ============================================================

OneWire oneWire(DS18B20_PIN);

DallasTemperature ds18b20(&oneWire);

DHT dht(
  DHT_PIN,
  DHT_TYPE
);

ESP8266WebServer server(80);

WiFiClient mqttWifiClient;

PubSubClient mqttClient(mqttWifiClient);

unsigned long lastMqttPublish = 0;
unsigned long lastMqttAttempt = 0;

// ============================================================
// MPU6500
// ============================================================

#define MPU_ADDR 0x68

#define WHO_AM_I_REG     0x75
#define PWR_MGMT_1_REG   0x6B
#define ACCEL_CONFIG_REG 0x1C
#define GYRO_CONFIG_REG  0x1B
#define ACCEL_XOUT_H_REG 0x3B

// ============================================================
// SENSOR VARIABLES
// ============================================================

bool mpuOK = false;
bool dsOK = false;
bool dhtOK = false;

float bodyTemp = 0;

float ambientTemp = 0;

float humidity = 0;

float accelX = 0;
float accelY = 0;
float accelZ = 0;

float gyroX = 0;
float gyroY = 0;
float gyroZ = 0;

float activity = 0;

int micAverage = 0;

int micMin = 0;

int micMax = 0;

int micPeakPeak = 0;

int riskScore = 0;

String riskLevel = "LOW";

// ============================================================
// TIMER
// ============================================================

unsigned long lastSensorTime = 0;

// ============================================================
// MPU WRITE
// ============================================================

bool mpuWrite(
  byte reg,
  byte value
) {

  Wire.beginTransmission(
    MPU_ADDR
  );

  Wire.write(reg);

  Wire.write(value);

  return (
    Wire.endTransmission() == 0
  );
}

// ============================================================
// MPU READ
// ============================================================

byte mpuRead(
  byte reg
) {

  Wire.beginTransmission(
    MPU_ADDR
  );

  Wire.write(reg);

  if (
    Wire.endTransmission(false) != 0
  ) {

    return 0;
  }

  Wire.requestFrom(
    MPU_ADDR,
    1
  );

  if (Wire.available()) {

    return Wire.read();
  }

  return 0;
}

// ============================================================
// MPU SETUP
// ============================================================

bool setupMPU() {

  byte who =
    mpuRead(
      WHO_AM_I_REG
    );

  Serial.print(
    "MPU WHO_AM_I = 0x"
  );

  Serial.println(
    who,
    HEX
  );

  if (
    who != 0x70 &&
    who != 0x68
  ) {

    Serial.println(
      "MPU FAIL"
    );

    return false;
  }

  // Wake MPU
  mpuWrite(
    PWR_MGMT_1_REG,
    0x00
  );

  delay(100);

  // Accelerometer ±2g
  mpuWrite(
    ACCEL_CONFIG_REG,
    0x00
  );

  // Gyroscope ±250 dps
  mpuWrite(
    GYRO_CONFIG_REG,
    0x00
  );

  Serial.println(
    "MPU PASS"
  );

  return true;
}

// ============================================================
// READ MPU
// ============================================================

void readMPU() {

  if (!mpuOK) {
    return;
  }

  Wire.beginTransmission(
    MPU_ADDR
  );

  Wire.write(
    ACCEL_XOUT_H_REG
  );

  if (
    Wire.endTransmission(false) != 0
  ) {

    mpuOK = false;

    return;
  }

  Wire.requestFrom(
    MPU_ADDR,
    14
  );

  if (
    Wire.available() < 14
  ) {

    return;
  }

  int16_t ax =
    (Wire.read() << 8) |
    Wire.read();

  int16_t ay =
    (Wire.read() << 8) |
    Wire.read();

  int16_t az =
    (Wire.read() << 8) |
    Wire.read();

  // Skip MPU temperature
  Wire.read();
  Wire.read();

  int16_t gx =
    (Wire.read() << 8) |
    Wire.read();

  int16_t gy =
    (Wire.read() << 8) |
    Wire.read();

  int16_t gz =
    (Wire.read() << 8) |
    Wire.read();

  // Convert acceleration
  accelX =
    ax / 16384.0;

  accelY =
    ay / 16384.0;

  accelZ =
    az / 16384.0;

  // Convert gyro
  gyroX =
    gx / 131.0;

  gyroY =
    gy / 131.0;

  gyroZ =
    gz / 131.0;

  // Activity
  float magnitude =
    sqrt(
      accelX * accelX +
      accelY * accelY +
      accelZ * accelZ
    );

  activity =
    fabs(
      magnitude - 1.0
    );
}

// ============================================================
// DS18B20
// ============================================================

void readDS18B20() {

  ds18b20.requestTemperatures();

  float temp =
    ds18b20.getTempCByIndex(0);

  if (
    temp == DEVICE_DISCONNECTED_C
  ) {

    dsOK = false;

    return;
  }

  bodyTemp = temp;

  dsOK = true;
}

// ============================================================
// DHT11
// ============================================================

void readDHT11() {

  // DHT11 is a slow sensor. Keep enough time between reads.
  static unsigned long lastDHTRead = 0;

  if (millis() - lastDHTRead < 2500) {
    return;
  }

  lastDHTRead = millis();

  float hum = dht.readHumidity();
  float temp = dht.readTemperature();

  if (isnan(temp) || isnan(hum)) {

    dhtOK = false;

    Serial.println("DHT11 ERROR: No valid reading");

    // Keep the previous valid value instead of replacing it with 0.
    return;
  }

  ambientTemp = temp;
  humidity = hum;
  dhtOK = true;

  Serial.print("DHT11 Temperature : ");
  Serial.print(ambientTemp, 1);
  Serial.println(" C");

  Serial.print("DHT11 Humidity    : ");
  Serial.print(humidity, 1);
  Serial.println(" %");
}

// ============================================================
// MAX4466
// ============================================================

void readMicrophone() {

  const int samples = 100;

  long total = 0;

  micMin = 1023;

  micMax = 0;

  for (
    int i = 0;
    i < samples;
    i++
  ) {

    int value =
      analogRead(
        MIC_PIN
      );

    total += value;

    if (
      value < micMin
    ) {

      micMin = value;
    }

    if (
      value > micMax
    ) {

      micMax = value;
    }

    delayMicroseconds(200);
  }

  micAverage =
    total / samples;

  micPeakPeak =
    micMax - micMin;
}

// ============================================================
// RISK SCORE
// ============================================================

void calculateRisk() {

  int score = 0;

  // DEMO ONLY

  // Body temperature
  if (
    dsOK &&
    bodyTemp >= 39.5
  ) {

    score += 40;

  } else if (
    dsOK &&
    bodyTemp > 37.5
  ) {

    float part =
      (
        bodyTemp - 37.5
      ) / 2.0;

    score +=
      (int)(part * 40);
  }

  // Low activity
  if (
    mpuOK &&
    activity < 0.15
  ) {

    score += 20;
  }

  // Microphone
  if (
    micAverage < 300
  ) {

    score += 15;
  }

  // Ambient temperature
  if (
    dhtOK &&
    ambientTemp >= 32
  ) {

    score += 15;
  }

  // Humidity
  if (
    dhtOK &&
    humidity >= 80
  ) {

    score += 10;
  }

  if (score > 100) {

    score = 100;
  }

  riskScore = score;

  if (
    riskScore < 30
  ) {

    riskLevel =
      "LOW";

  } else if (
    riskScore < 60
  ) {

    riskLevel =
      "MODERATE";

  } else {

    riskLevel =
      "HIGH";
  }

  // LED
  if (
    riskLevel == "HIGH"
  ) {

    digitalWrite(
      LED_PIN,
      HIGH
    );

  } else {

    digitalWrite(
      LED_PIN,
      LOW
    );
  }
}

// ============================================================
// SERIAL OUTPUT
// ============================================================

void printSerial() {

  Serial.println();
  Serial.println(
    "======================================"
  );

  Serial.println(
    "        SMART COW BELT"
  );

  Serial.println(
    "======================================"
  );

  Serial.print(
    "Device ID        : "
  );

  Serial.println(
    DEVICE_ID
  );

  Serial.print(
    "MQTT Broker      : "
  );

  Serial.print(
    MQTT_HOST
  );

  Serial.print(
    ":"
  );

  Serial.println(
    MQTT_PORT
  );

  Serial.println();

  Serial.print(
    "Body Temperature : "
  );

  Serial.print(
    bodyTemp,
    2
  );

  Serial.println(
    " C"
  );

  Serial.print(
    "Ambient Temp     : "
  );

  Serial.print(
    ambientTemp,
    2
  );

  Serial.println(
    " C"
  );

  Serial.print(
    "Humidity         : "
  );

  Serial.print(
    humidity,
    2
  );

  Serial.println(
    " %"
  );

  Serial.print(
    "Activity         : "
  );

  Serial.println(
    activity,
    3
  );

  Serial.print(
    "Mic Average      : "
  );

  Serial.println(
    micAverage
  );

  Serial.print(
    "Mic Peak-Peak    : "
  );

  Serial.println(
    micPeakPeak
  );

  Serial.println();

  Serial.print(
    "Accel X          : "
  );

  Serial.println(
    accelX,
    3
  );

  Serial.print(
    "Accel Y          : "
  );

  Serial.println(
    accelY,
    3
  );

  Serial.print(
    "Accel Z          : "
  );

  Serial.println(
    accelZ,
    3
  );

  Serial.println();

  Serial.print(
    "Gyro X           : "
  );

  Serial.println(
    gyroX,
    3
  );

  Serial.print(
    "Gyro Y           : "
  );

  Serial.println(
    gyroY,
    3
  );

  Serial.print(
    "Gyro Z           : "
  );

  Serial.println(
    gyroZ,
    3
  );

  Serial.println();

  Serial.print(
    "Risk Score       : "
  );

  Serial.println(
    riskScore
  );

  Serial.print(
    "Risk Level       : "
  );

  Serial.println(
    riskLevel
  );

  Serial.println(
    "DEMO RISK SCORE - NOT A CLINICAL DIAGNOSIS"
  );

  Serial.println();

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.println(
      "WiFi             : CONNECTED"
    );

    Serial.print(
      "ESP8266 IP       : "
    );

    Serial.println(
      WiFi.localIP()
    );

    Serial.print(
      "MQTT             : "
    );

    Serial.println(
      mqttClient.connected()
        ? "CONNECTED"
        : "DISCONNECTED"
    );

    Serial.print(
      "Dashboard        : http://"
    );

    Serial.println(
      WiFi.localIP()
    );

  } else {

    Serial.println(
      "WiFi             : DISCONNECTED"
    );
  }

  Serial.println(
    "======================================"
  );
}

// ============================================================
// PHONE DASHBOARD
// ============================================================

String webpage() {

  String riskColor =
    "#22c55e";

  if (
    riskLevel ==
    "MODERATE"
  ) {

    riskColor =
      "#f59e0b";
  }

  if (
    riskLevel ==
    "HIGH"
  ) {

    riskColor =
      "#ef4444";
  }

  String html = "";

  html +=
    "<!DOCTYPE html>";

  html +=
    "<html>";

  html +=
    "<head>";

  html +=
    "<meta name='viewport' "
    "content='width=device-width,initial-scale=1'>";

  html +=
    "<meta http-equiv='refresh' "
    "content='2'>";

  html +=
    "<title>Smart Cow Belt</title>";

  html += "<style>";

  html +=
    "body{"
    "font-family:Arial;"
    "background:#eef2f7;"
    "margin:0;"
    "padding:15px;"
    "}";

  html +=
    ".container{"
    "max-width:700px;"
    "margin:auto;"
    "}";

  html +=
    "h1{text-align:center;}";

  html +=
    ".sub{text-align:center;color:#667085;}";

  html +=
    ".grid{"
    "display:grid;"
    "grid-template-columns:1fr 1fr;"
    "gap:12px;"
    "}";

  html +=
    ".card{"
    "background:white;"
    "padding:18px;"
    "border-radius:15px;"
    "margin-bottom:12px;"
    "box-shadow:0 3px 12px rgba(0,0,0,.08);"
    "}";

  html +=
    ".label{"
    "color:#667085;"
    "font-size:14px;"
    "}";

  html +=
    ".value{"
    "font-size:25px;"
    "font-weight:bold;"
    "margin-top:7px;"
    "}";

  html +=
    ".risk{"
    "text-align:center;"
    "font-size:32px;"
    "font-weight:bold;"
    "color:" +
    riskColor +
    ";"
    "}";

  html +=
    ".full{"
    "grid-column:1/3;"
    "}";

  html +=
    "table{"
    "width:100%;"
    "border-collapse:collapse;"
    "}";

  html +=
    "td{"
    "padding:8px;"
    "border-bottom:1px solid #eee;"
    "}";

  html += "</style>";

  html += "</head>";

  html += "<body>";

  html +=
    "<div class='container'>";

  html +=
    "<h1>🐄 Smart Cow Belt</h1>";

  html +=
    "<div class='sub'>"
    "ESP8266 Live Monitoring"
    "</div>";

  // Risk
  html +=
    "<div class='card'>";

  html +=
    "<div class='label'>DEMO RISK SCORE</div>";

  html +=
    "<div class='value' "
    "style='text-align:center;'>";

  html +=
    String(
      riskScore
    );

  html +=
    " / 100</div>";

  html +=
    "<div class='risk'>";

  html +=
    riskLevel;

  html +=
    "</div>";

  html +=
    "</div>";

  // Sensor grid
  html +=
    "<div class='grid'>";

  html +=
    "<div class='card'>"
    "<div class='label'>Body Temperature</div>"
    "<div class='value'>" +
    String(
      bodyTemp,
      2
    ) +
    " °C</div>"
    "</div>";

  html +=
    "<div class='card'>"
    "<div class='label'>Ambient Temperature</div>"
    "<div class='value'>" +
    String(
      ambientTemp,
      2
    ) +
    " °C</div>"
    "</div>";

  html +=
    "<div class='card'>"
    "<div class='label'>Humidity</div>"
    "<div class='value'>" +
    String(
      humidity,
      1
    ) +
    " %</div>"
    "</div>";

  html +=
    "<div class='card'>"
    "<div class='label'>Activity</div>"
    "<div class='value'>" +
    String(
      activity,
      3
    ) +
    "</div>"
    "</div>";

  html +=
    "<div class='card'>"
    "<div class='label'>Mic Average</div>"
    "<div class='value'>" +
    String(
      micAverage
    ) +
    "</div>"
    "</div>";

  html +=
    "<div class='card'>"
    "<div class='label'>Mic Peak-Peak</div>"
    "<div class='value'>" +
    String(
      micPeakPeak
    ) +
    "</div>"
    "</div>";

  // MPU
  html +=
    "<div class='card full'>";

  html +=
    "<h3>MPU-6500 Motion</h3>";

  html +=
    "<table>";

  html +=
    "<tr><td>Accel X</td><td>" +
    String(
      accelX,
      3
    ) +
    " g</td></tr>";

  html +=
    "<tr><td>Accel Y</td><td>" +
    String(
      accelY,
      3
    ) +
    " g</td></tr>";

  html +=
    "<tr><td>Accel Z</td><td>" +
    String(
      accelZ,
      3
    ) +
    " g</td></tr>";

  html +=
    "<tr><td>Gyro X</td><td>" +
    String(
      gyroX,
      3
    ) +
    " dps</td></tr>";

  html +=
    "<tr><td>Gyro Y</td><td>" +
    String(
      gyroY,
      3
    ) +
    " dps</td></tr>";

  html +=
    "<tr><td>Gyro Z</td><td>" +
    String(
      gyroZ,
      3
    ) +
    " dps</td></tr>";

  html +=
    "</table>";

  html +=
    "</div>";

  // Status
  html +=
    "<div class='card full'>";

  html +=
    "<h3>Connection & Sensor Status</h3>";

  html +=
    "<p>WiFi: " +
    String(
      WiFi.status() == WL_CONNECTED
        ? "CONNECTED"
        : "DISCONNECTED"
    ) +
    "</p>";

  html +=
    "<p>MQTT: " +
    String(
      mqttClient.connected()
        ? "CONNECTED"
        : "DISCONNECTED"
    ) +
    "</p>";

  html +=
    "<p>Device ID: " +
    String(
      DEVICE_ID
    ) +
    "</p>";

  html +=
    "<p>MPU-6500: " +
    String(
      mpuOK ?
      "PASS" :
      "FAIL"
    ) +
    "</p>";

  html +=
    "<p>DS18B20: " +
    String(
      dsOK ?
      "PASS" :
      "FAIL"
    ) +
    "</p>";

  html +=
    "<p>DHT11: " +
    String(
      dhtOK ?
      "PASS" :
      "FAIL"
    ) +
    "</p>";

  html +=
    "<p>MAX4466: PASS</p>";

  html +=
    "</div>";

  html +=
    "</div>";

  html +=
    "<p style='text-align:center;"
    "color:#777;font-size:12px;'>"
    "Refresh: 2 seconds<br>"
    "Prototype system - not a clinical diagnosis"
    "</p>";

  html +=
    "</div>";

  html +=
    "</body>";

  html +=
    "</html>";

  return html;
}

// ============================================================
// WIFI
// ============================================================

void connectWiFi() {

  Serial.println();

  Serial.println(
    "Connecting to WiFi: Faijan"
  );

  WiFi.mode(
    WIFI_STA
  );

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 40
  ) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.println(
      "WIFI CONNECTED!"
    );

    Serial.print(
      "ESP8266 IP ADDRESS: "
    );

    Serial.println(
      WiFi.localIP()
    );

    Serial.print(
      "LAPTOP MQTT HOST: "
    );

    Serial.println(
      MQTT_HOST
    );

    Serial.print(
      "MQTT PORT: "
    );

    Serial.println(
      MQTT_PORT
    );

    Serial.println();

    Serial.print(
      "OPEN PHONE DASHBOARD: http://"
    );

    Serial.println(
      WiFi.localIP()
    );

  } else {

    Serial.println(
      "WIFI CONNECTION FAILED"
    );

    Serial.println(
      "Check WiFi name/password."
    );
  }
}

// ============================================================
// MQTT FUNCTIONS
// ============================================================

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  if (millis() - lastMqttAttempt < 5000) return;
  lastMqttAttempt = millis();

  Serial.println();
  Serial.println("======================================");
  Serial.println("       MQTT CONNECTION TEST");
  Serial.println("======================================");

  Serial.print("ESP8266 IP     : ");
  Serial.println(WiFi.localIP());

  Serial.print("MQTT HOST      : ");
  Serial.println(MQTT_HOST);

  Serial.print("MQTT PORT      : ");
  Serial.println(MQTT_PORT);

  Serial.println("Testing TCP connection...");

  WiFiClient testClient;

  if (testClient.connect(MQTT_HOST, MQTT_PORT)) {
    Serial.println("TCP CONNECTION : OK");
    testClient.stop();
  } else {
    Serial.println("TCP CONNECTION : FAILED");
    Serial.println("Check Mosquitto, port 1884, and Windows Firewall.");
    Serial.println("======================================");
    return;
  }

  String clientId =
    String(DEVICE_ID) + "-" +
    String(ESP.getChipId(), HEX);

  Serial.print("MQTT Client ID : ");
  Serial.println(clientId);
  Serial.println("Connecting to MQTT broker...");

  bool connected;

  if (strlen(MQTT_USERNAME) == 0) {
    connected = mqttClient.connect(clientId.c_str());
  } else {
    connected = mqttClient.connect(
      clientId.c_str(),
      MQTT_USERNAME,
      MQTT_PASSWORD
    );
  }

  if (connected) {
    Serial.println();
    Serial.println("**************************************");
    Serial.println("       MQTT CONNECTED SUCCESSFULLY");
    Serial.println("**************************************");
    Serial.print("Broker : ");
    Serial.print(MQTT_HOST);
    Serial.print(":");
    Serial.println(MQTT_PORT);
    Serial.print("Topic  : ");
    Serial.println(MQTT_TOPIC);
    Serial.println("======================================");
  } else {
    Serial.println();
    Serial.println("**************************************");
    Serial.println("        MQTT CONNECTION FAILED");
    Serial.println("**************************************");
    Serial.print("MQTT STATE CODE : ");
    Serial.println(mqttClient.state());

    switch (mqttClient.state()) {
      case -4: Serial.println("ERROR: MQTT CONNECTION TIMEOUT"); break;
      case -3: Serial.println("ERROR: MQTT CONNECTION LOST"); break;
      case -2: Serial.println("ERROR: MQTT CONNECT FAILED"); break;
      case -1: Serial.println("ERROR: MQTT DISCONNECTED"); break;
      case 0:  Serial.println("MQTT CONNECTED"); break;
      case 1:  Serial.println("ERROR: BAD MQTT PROTOCOL"); break;
      case 2:  Serial.println("ERROR: BAD MQTT CLIENT ID"); break;
      case 3:  Serial.println("ERROR: MQTT BROKER UNAVAILABLE"); break;
      case 4:  Serial.println("ERROR: BAD USERNAME/PASSWORD"); break;
      case 5:  Serial.println("ERROR: MQTT NOT AUTHORIZED"); break;
      default: Serial.println("ERROR: UNKNOWN MQTT ERROR"); break;
    }

    Serial.println("======================================");
  }
}



void publishSensorData() {

  if (
    !mqttClient.connected()
  ) {

    return;
  }

  StaticJsonDocument<768> doc;

  doc["device_id"] =
    DEVICE_ID;

  doc["activity"] =
    activity;

  doc["surface_temperature"] =
    bodyTemp;

  doc["ambient_temperature"] =
    ambientTemp;

  doc["humidity"] =
    humidity;

  doc["chewing_acoustic_signal"] =
    micPeakPeak;

  // Simple acoustic proxy only.
  // NOT a validated rumination model.
  float ruminationProxy =
    min(
      60.0f,
      micPeakPeak / 10.0f
    );

  doc["rumination_inferred_min"] =
    ruminationProxy;

  doc["motion"] =
    activity;

  doc["local_prototype_risk_score"] =
    riskScore;

  doc["local_prototype_risk_level"] =
    riskLevel;

  doc["device_uptime_ms"] =
    millis();

  char payload[768];

  size_t n =
    serializeJson(
      doc,
      payload,
      sizeof(payload)
    );

  if (n == 0) {

    Serial.println(
      "MQTT JSON serialization failed"
    );

    return;
  }

  if (
    mqttClient.publish(
      MQTT_TOPIC,
      payload
    )
  ) {

    Serial.println(
      "MQTT DATA PUBLISHED"
    );

    Serial.println(
      payload
    );

  } else {

    Serial.println(
      "MQTT PUBLISH FAILED"
    );
  }
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(
    115200
  );

  delay(1000);

  Serial.println();

  Serial.println(
    "======================================"
  );

  Serial.println(
    " SMART COW BELT - DHT11 VERSION"
  );

  Serial.println(
    "======================================"
  );

  // LED
  pinMode(
    LED_PIN,
    OUTPUT
  );

  digitalWrite(
    LED_PIN,
    LOW
  );

  // I2C
  Wire.begin(
    MPU_SDA,
    MPU_SCL
  );

  // MPU
  mpuOK =
    setupMPU();

  // DS18B20
  ds18b20.begin();

  Serial.println(
    "DS18B20 started."
  );

  // DHT11
  dht.begin();

  // Give the DHT11 time to stabilize after power-up.
  delay(2000);

  Serial.println(
    "DHT11 started."
  );

  // MAX4466
  Serial.println(
    "MAX4466 started."
  );

  // WiFi
  connectWiFi();

  // MQTT
  mqttClient.setServer(
    MQTT_HOST,
    MQTT_PORT
  );

  mqttClient.setBufferSize(
    1024
  );

  connectMQTT();

  // Web server
  server.on(
    "/",
    []() {

      server.send(
        200,
        "text/html",
        webpage()
      );
    }
  );

  server.on(
    "/data",
    handleData
  );

  server.begin();

  Serial.println();

  Serial.println(
    "WEB SERVER STARTED"
  );

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.print(
      "Dashboard URL: http://"
    );

    Serial.println(
      WiFi.localIP()
    );
  }
}

// ============================================================
// JSON DATA
// ============================================================

void handleData() {

  String json = "{";

  json +=
    "\"device_id\":\"" +
    String(DEVICE_ID) +
    "\",";

  json +=
    "\"body_temperature\":" +
    String(
      bodyTemp,
      2
    ) +
    ",";

  json +=
    "\"ambient_temperature\":" +
    String(
      ambientTemp,
      2
    ) +
    ",";

  json +=
    "\"humidity\":" +
    String(
      humidity,
      1
    ) +
    ",";

  json +=
    "\"activity\":" +
    String(
      activity,
      3
    ) +
    ",";

  json +=
    "\"mic_average\":" +
    String(
      micAverage
    ) +
    ",";

  json +=
    "\"mic_peak_peak\":" +
    String(
      micPeakPeak
    ) +
    ",";

  json +=
    "\"risk_score\":" +
    String(
      riskScore
    ) +
    ",";

  json +=
    "\"risk_level\":\"" +
    riskLevel +
    "\",";

  json +=
    "\"wifi_connected\":" +
    String(
      WiFi.status() == WL_CONNECTED
        ? "true"
        : "false"
    ) +
    ",";

  json +=
    "\"mqtt_connected\":" +
    String(
      mqttClient.connected()
        ? "true"
        : "false"
    );

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );
}

// ============================================================
// LOOP
// ============================================================

void loop() {

  // Keep phone dashboard active
  server.handleClient();

  // Keep MQTT alive
  connectMQTT();

  mqttClient.loop();

  // Read sensors every 2 seconds
  if (
    millis() -
    lastSensorTime >=
    2000
  ) {

    lastSensorTime =
      millis();

    readMPU();

    readDS18B20();

    readDHT11();

    readMicrophone();

    calculateRisk();

    printSerial();

    // Publish sensor data every 2 seconds
    if (
      millis() -
      lastMqttPublish >=
      2000
    ) {

      lastMqttPublish =
        millis();

      publishSensorData();
    }
  }
}