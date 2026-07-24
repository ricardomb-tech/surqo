/**
 * Surqo Node — Firmware ESP32 v2
 * "Del surco al insight"
 *
 * Sin FARM_ID ni WiFi hardcodeados:
 *  - WiFi: portal cautivo (WiFiManager) en el primer arranque
 *  - Identidad: MAC del ESP32 → código de emparejamiento (claim code)
 *  - El usuario empareja el nodo con su finca desde la app usando ese código
 *
 * Sensores: DHT22, DS18B20, Capacitive Soil, ML8511 UV, Voltage divider
 * Protocolo: MQTT TLS → HiveMQ | Fallback: HTTP → FastAPI
 * Power: Deep Sleep entre lecturas
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <esp_sleep.h>
#include <time.h>

#include "config.h"

// ─── Objetos globales ────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT22);
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);
WiFiClientSecure mqttTls;
PubSubClient mqttClient(mqttTls);
Preferences prefs;  // NVS — sobrevive al deep sleep (a diferencia de la RAM)

String g_mac;          // identidad: a4cf12a3f2c1 (minúsculas, sin ":")
String g_claimCode;    // código para el usuario: A3F2C1
String g_deviceSecret; // emitido una vez por el backend tras el claim (TOFU); vacío hasta entonces

// ISRG Root X1 (Let's Encrypt) — verificado en 2026-07-17 contra la cadena real
// de MQTT_HOST (*.s1.eu.hivemq.cloud) y API_BASE_URL (*.fly.dev): ambas cuelgan
// de este root. Si algún día HiveMQ o Fly.io cambian de CA, la conexión fallará
// limpiamente (no de forma insegura) y habrá que actualizar este certificado.
// Verificar con: openssl s_client -connect HOST:PUERTO -showcerts
static const char ROOT_CA_CERT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

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
void   computeIdentity();
bool   connectWiFiManaged();
void   registerDevice();
bool   connectMQTT();
SensorData readAllSensors();
void   publishSensorData(const SensorData& data);
bool   fallbackHTTP(const SensorData& data);
bool   httpsPost(const String& url, const String& body, String& response);
String buildJSON(const SensorData& data);
String getISO8601Timestamp();
int    averageADC(int pin, int samples);
float  mapFloat(float x, float in_min, float in_max, float out_min, float out_max);

// ─── Setup (corre en cada ciclo después del deep sleep) ─────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n═══════════════════════════════════");
  Serial.println("  SURQO NODE v" FIRMWARE_VERSION);
  Serial.println("  Del surco al insight");
  Serial.println("═══════════════════════════════════");

  computeIdentity();

  prefs.begin("surqo", /*readOnly=*/false);
  g_deviceSecret = prefs.getString("secret", "");
  prefs.end();

  Serial.println("┌───────────────────────────────────");
  Serial.printf ("│ MAC del nodo : %s\n", g_mac.c_str());
  Serial.printf ("│ CÓDIGO DE EMPAREJAMIENTO: %s\n", g_claimCode.c_str());
  Serial.println("│ Escribe ese código en la app Surqo");
  Serial.println("│ para vincular este nodo con tu finca.");
  Serial.println("└───────────────────────────────────");

  // Activar sensores
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  digitalWrite(SENSOR_POWER_PIN, HIGH);
  delay(SENSOR_WARMUP_MS);

  dht.begin();
  ds18b20.begin();
  ds18b20.setResolution(12);

  // Leer sensores ANTES del WiFi (el radio interfiere con el timing del DHT22)
  SensorData data = readAllSensors();

  // WiFi por portal cautivo (usa credenciales guardadas si ya existen)
  bool wifiOk = connectWiFiManaged();

  if (wifiOk) {
    configTime(-18000, 0, "pool.ntp.org", "time.nist.gov");  // UTC-5 Colombia
    delay(1500);
    registerDevice();  // best-effort: anuncia el nodo al backend
  }

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
    if (!published) Serial.println("⚠️  Sin publicación — sin conexión");
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

// ─── Identidad por MAC ───────────────────────────────────────────────────────
void computeIdentity() {
  WiFi.mode(WIFI_STA);
  String raw = WiFi.macAddress();  // "A4:CF:12:A3:F2:C1"
  raw.replace(":", "");
  raw.toLowerCase();
  g_mac = raw;
  g_claimCode = g_mac.substring(g_mac.length() - 6);
  g_claimCode.toUpperCase();
}

// ─── WiFi con portal cautivo ─────────────────────────────────────────────────
bool connectWiFiManaged() {
  WiFiManager wm;
  wm.setConfigPortalTimeout(PORTAL_TIMEOUT_S);
  wm.setConnectTimeout(WIFI_TIMEOUT_MS / 1000);

  String apName = "Surqo-Setup-" + g_claimCode;
  Serial.printf("📶 Conectando WiFi (si es 1ª vez, únete a la red \"%s\")...\n", apName.c_str());

  bool ok = wm.autoConnect(apName.c_str(), AP_PASSWORD);
  if (ok) {
    Serial.printf("✅ WiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("❌ Sin WiFi (portal expiró). Reintenta en el próximo ciclo.");
  }
  return ok;
}

// ─── Registro del dispositivo en el backend ──────────────────────────────────
void registerDevice() {
  JsonDocument doc;
  doc["device_mac"] = g_mac;
  doc["firmware_version"] = FIRMWARE_VERSION;
  String body, resp;
  serializeJson(doc, body);

  if (httpsPost(String(API_BASE_URL) + "/api/v1/devices/register", body, resp)) {
    Serial.printf("🔗 Registrado en Surqo: %s\n", resp.c_str());

    // El backend entrega el secreto UNA sola vez, dentro de los 5 min
    // posteriores a que el dueño empareje el nodo (POST /claim). Si llega,
    // se guarda en NVS para siempre — deep sleep borra la RAM pero no esto.
    if (g_deviceSecret.length() == 0) {
      JsonDocument respDoc;
      if (deserializeJson(respDoc, resp) == DeserializationError::Ok) {
        const char* secret = respDoc["device_secret"] | "";
        if (strlen(secret) > 0) {
          g_deviceSecret = String(secret);
          prefs.begin("surqo", false);
          prefs.putString("secret", g_deviceSecret);
          prefs.end();
          Serial.println("🔐 Secreto de dispositivo recibido y guardado en NVS");
        }
      }
    }
  } else {
    Serial.println("ℹ️  No se pudo registrar ahora (se reintenta luego)");
  }
}

// ─── MQTT TLS ─────────────────────────────────────────────────────────────────
bool connectMQTT() {
  // Valida el certificado del broker contra ISRG Root X1 (evita MITM en la
  // red WiFi local en vez de aceptar cualquier certificado como antes).
  mqttTls.setCACert(ROOT_CA_CERT);
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(1024);

  String clientId = "surqo-" + g_mac;
  Serial.printf("📡 Conectando MQTT a %s...", MQTT_HOST);
  if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" ✅");
    return true;
  }
  Serial.printf(" ❌ (error: %d)\n", mqttClient.state());
  return false;
}

// ─── Publicar datos por MQTT ──────────────────────────────────────────────────
void publishSensorData(const SensorData& data) {
  String topic = "surqo/devices/" + g_mac + "/sensors";
  String payload = buildJSON(data);
  mqttClient.publish(topic.c_str(), payload.c_str(), false);
  mqttClient.loop();
  delay(100);
}

// ─── Fallback HTTP ────────────────────────────────────────────────────────────
bool fallbackHTTP(const SensorData& data) {
  String url = String(API_BASE_URL) + "/api/v1/devices/" + g_mac + "/reading";
  String resp;
  return httpsPost(url, buildJSON(data), resp);
}

bool httpsPost(const String& url, const String& body, String& response) {
  WiFiClientSecure client;
  client.setCACert(ROOT_CA_CERT);
  HTTPClient http;
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  if (code > 0) response = http.getString();
  http.end();
  return (code >= 200 && code < 300);
}

// ─── Construir JSON ────────────────────────────────────────────────────────────
String buildJSON(const SensorData& data) {
  JsonDocument doc;
  doc["device_id"] = g_mac;
  doc["device_mac"] = g_mac;
  doc["claim_code"] = g_claimCode;
  if (g_deviceSecret.length() > 0) {
    doc["device_secret"] = g_deviceSecret;
  }
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
  d.soilMoisturePct = mapFloat(rawSoil, SOIL_DRY_ADC, SOIL_WET_ADC, 0.0, 100.0);
  d.soilMoisturePct = constrain(d.soilMoisturePct, 0.0, 100.0);

  // ML8511: índice UV
  int rawUV = averageADC(UV_SENSOR_PIN, ADC_SAMPLES);
  float voltUV = rawUV * 3.3 / 4095.0;
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
