#pragma once

// ═══════════════════════════════════════════════
// SURQO NODE — Configuración del nodo ESP32
// "Del surco al insight"
// ═══════════════════════════════════════════════

// WiFi
#define WIFI_SSID         "TU_RED_WIFI"
#define WIFI_PASSWORD     "TU_PASSWORD_WIFI"
#define WIFI_TIMEOUT_MS   30000

// HiveMQ Cloud MQTT
#define MQTT_HOST         "tu-cluster.hivemq.cloud"
#define MQTT_PORT         8883
#define MQTT_USERNAME     "surqo-user"
#define MQTT_PASSWORD     "tu_password"
#define MQTT_CLIENT_ID    "surqo-node-001"

// Identidad del nodo
#define DEVICE_ID         "ESP32-NODE-001"
#define FARM_ID           "tu-farm-uuid"
#define FIRMWARE_VERSION  "1.0.0"

// Pines sensores
#define DHT_PIN           4     // DHT22 — Temp/Humedad aire
#define DS18B20_PIN       5     // DS18B20 waterproof — Temp suelo
#define SOIL_MOISTURE_PIN 32    // Sensor capacitivo — ADC1_CH4
#define UV_SENSOR_PIN     34    // ML8511 — ADC1_CH6
#define BATTERY_PIN       35    // Divisor de voltaje — ADC1_CH7
#define SENSOR_POWER_PIN  25    // Cortar power a sensores en sleep

// Calibración sensor capacitivo (calibrar en TU suelo específico)
#define SOIL_DRY_ADC      3200  // ADC raw en suelo completamente seco
#define SOIL_WET_ADC      1200  // ADC raw en suelo saturado

// Tiempos
#define SLEEP_MINUTES     15    // Deep sleep entre lecturas (min)
#define SENSOR_WARMUP_MS  500   // Tiempo de estabilización sensores

// URLs fallback HTTP (si MQTT falla)
#define API_FALLBACK_URL  "https://surqo-api.onrender.com/api/v1/sensors/reading"

// ADC averaging
#define ADC_SAMPLES       10    // Muestras para promediar ADC y reducir ruido
