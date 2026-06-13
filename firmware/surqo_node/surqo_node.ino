/**
 * Surqo Node — Firmware ESP32
 * "Del surco al insight"
 *
 * Sensores: DHT22, DS18B20, Capacitive Soil v2, ML8511 UV, Voltage divider
 * Protocolo: MQTT TLS → HiveMQ Cloud | Fallback: HTTP → FastAPI
 * Power: Deep Sleep 15 min entre lecturas
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include <esp_sleep.h>
#include <time.h>

#include "config.h"

// ─── Objetos globales ────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT11);  // cambiar a DHT22 cuando se tenga
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);
WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── Struct de datos ─────────────────────────────────────────────────────────
struct SensorData {
  float soilMoisturePct;
  float soilTempC;
  float airTempC;
  float airHumidityPct;
  float uvIndex;
  int   batteryMv;
  int   rssi;
  bool  valid;
};

// ─── Prototipos ──────────────────────────────────────────────────────────────
bool connectWiFi();
bool connectMQTT();
SensorData readAllSensors();
void publishSensorData(const SensorData& data);
bool fallbackHTTP(const SensorData& data);
String buildJSON(const SensorData& data);
String getISO8601Timestamp();
int averageADC(int pin, int samples);
float mapFloat(float x, float in_min, float in_max, float out_min, float out_max);

// ─── Setup (corre en cada ciclo después del deep sleep) ─────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n═══════════════════════════════════");
  Serial.println("  SURQO NODE v" FIRMWARE_VERSION);
  Serial.println("  Del surco al insight");
  Serial.println("═══════════════════════════════════");

  // Activar sensores
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  digitalWrite(SENSOR_POWER_PIN, HIGH);
  delay(SENSOR_WARMUP_MS);

  // Inicializar sensores
  dht.begin();
  ds18b20.begin();
  ds18b20.setResolution(12);

  // Sincronizar NTP (UTC-5 Colombia)
  bool wifiOk = connectWiFi();

  if (wifiOk) {
    configTime(-18000, 0, "pool.ntp.org", "time.nist.gov");
    delay(1500);  // Esperar sincronización NTP
  }

  // Leer sensores
  SensorData data = readAllSensors();

  if (data.valid) {
    Serial.println("\n📊 Lectura actual:");
    Serial.printf("  Suelo: %.1f%% humedad | %.1f°C\n", data.soilMoisturePct, data.soilTempC);
    Serial.printf("  Aire:  %.1f°C | %.1f%% HR\n", data.airTempC, data.airHumidityPct);
    Serial.printf("  UV:    %.1f | Batería: %dmV\n", data.uvIndex, data.batteryMv);
    Serial.printf("  RSSI:  %d dBm\n", data.rssi);

    bool published = false;

    if (wifiOk) {
      if (connectMQTT()) {
        publishSensorData(data);
        published = true;
        Serial.println("✅ Publicado por MQTT");
      } else {
        published = fallbackHTTP(data);
        if (published) Serial.println("✅ Publicado por HTTP fallback");
      }
    }

    if (!published) {
      Serial.println("⚠️  Sin publicación — sin conexión");
    }
  } else {
    Serial.println("❌ Error leyendo sensores");
  }

  // Apagar sensores para ahorrar energía
  digitalWrite(SENSOR_POWER_PIN, LOW);
  mqttClient.disconnect();
  WiFi.disconnect(true);

  Serial.printf("\n💤 Deep sleep %d min...\n", SLEEP_MINUTES);
  delay(100);
  esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_MINUTES * 60 * 1000000ULL);
  esp_deep_sleep_start();
}

void loop() {
  // No se usa — el ESP32 duerme entre lecturas
}

// ─── WiFi ─────────────────────────────────────────────────────────────────────
bool connectWiFi() {
  Serial.printf("📶 Conectando a %s...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("\n❌ WiFi timeout");
  return false;
}

// ─── MQTT TLS ─────────────────────────────────────────────────────────────────
bool connectMQTT() {
  wifiClient.setInsecure();  // Para HiveMQ Cloud — en producción usar setCACert()
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(1024);

  Serial.printf("📡 Conectando MQTT a %s...", MQTT_HOST);
  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" ✅");
    return true;
  }
  Serial.printf(" ❌ (error: %d)\n", mqttClient.state());
  return false;
}

// ─── Publicar datos por MQTT ──────────────────────────────────────────────────
void publishSensorData(const SensorData& data) {
  String topic = String("surqo/farms/") + FARM_ID + "/sensors";
  String payload = buildJSON(data);
  mqttClient.publish(topic.c_str(), payload.c_str(), false);
  mqttClient.loop();
  delay(100);
}

// ─── Fallback HTTP ────────────────────────────────────────────────────────────
bool fallbackHTTP(const SensorData& data) {
  HTTPClient http;
  http.begin(API_FALLBACK_URL);
  http.addHeader("Content-Type", "application/json");
  String payload = buildJSON(data);
  int code = http.POST(payload);
  http.end();
  return (code == 200 || code == 201);
}

// ─── Construir JSON ────────────────────────────────────────────────────────────
String buildJSON(const SensorData& data) {
  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["farm_id"] = FARM_ID;
  doc["timestamp"] = getISO8601Timestamp();
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["battery_mv"] = data.batteryMv;
  doc["rssi_dbm"] = data.rssi;

  JsonObject sensors = doc["sensors"].to<JsonObject>();
  sensors["soil_moisture_pct"] = round(data.soilMoisturePct * 10) / 10.0;
  sensors["soil_temp_c"] = round(data.soilTempC * 10) / 10.0;
  sensors["air_temp_c"] = round(data.airTempC * 10) / 10.0;
  sensors["air_humidity_pct"] = round(data.airHumidityPct * 10) / 10.0;
  sensors["light_uv_index"] = round(data.uvIndex * 10) / 10.0;

  String output;
  serializeJson(doc, output);
  return output;
}

// ─── Leer todos los sensores ──────────────────────────────────────────────────
SensorData readAllSensors() {
  SensorData d = {0};

  // DHT22: promedio de 3 lecturas válidas
  float sumTemp = 0, sumHum = 0;
  int validDHT = 0;
  for (int i = 0; i < 5; i++) {
    delay(300);
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      sumTemp += t;
      sumHum += h;
      validDHT++;
      if (validDHT >= 3) break;
    }
  }
  if (validDHT > 0) {
    d.airTempC = sumTemp / validDHT;
    d.airHumidityPct = sumHum / validDHT;
  } else {
    d.airTempC = NAN;
    d.airHumidityPct = NAN;
  }

  // DS18B20: temperatura del suelo
  ds18b20.requestTemperatures();
  delay(750);
  float soilTemp = ds18b20.getTempCByIndex(0);
  d.soilTempC = (soilTemp != DEVICE_DISCONNECTED_C) ? soilTemp : NAN;

  // Sensor capacitivo: 10 muestras ADC promediadas
  int rawSoil = averageADC(SOIL_MOISTURE_PIN, ADC_SAMPLES);
  // Invertir: mayor ADC = más seco
  d.soilMoisturePct = mapFloat(rawSoil, SOIL_DRY_ADC, SOIL_WET_ADC, 0.0, 100.0);
  d.soilMoisturePct = constrain(d.soilMoisturePct, 0.0, 100.0);

  // ML8511: índice UV
  int rawUV = averageADC(UV_SENSOR_PIN, ADC_SAMPLES);
  float voltUV = rawUV * 3.3 / 4095.0;
  // Calibración ML8511: 0V = 0 UV, 1V = 15 UV (aprox)
  d.uvIndex = max(0.0f, (voltUV - 0.99f) * 17.0f);

  // Batería: divisor de voltaje (R1=100k, R2=100k → factor 2)
  int rawBat = averageADC(BATTERY_PIN, ADC_SAMPLES);
  d.batteryMv = (int)((rawBat * 3300.0 / 4095.0) * 2.0);

  d.rssi = WiFi.RSSI();
  d.valid = (validDHT > 0);
  return d;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
int averageADC(int pin, int samples) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return (int)(sum / samples);
}

float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

String getISO8601Timestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00-05:00";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S-05:00", &timeinfo);
  return String(buf);
}
