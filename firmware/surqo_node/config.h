#pragma once

// Ensure Arduino core types and macros are available when this header is
// included from .ino files or other translation units. This helps IDEs and
// build systems resolve include paths and reduces "include errors detected"
#include <Arduino.h>

// ═══════════════════════════════════════════════
// SURQO NODE — Configuración del nodo ESP32
// "Del surco al insight"
// ═══════════════════════════════════════════════
//
// El WiFi ya NO se configura aquí: en el primer arranque el nodo abre un portal
// cautivo (red "Surqo-Setup-XXXX") donde el agricultor escribe su WiFi desde el
// celular. Tampoco hay FARM_ID: el nodo se identifica por su MAC y el usuario lo
// empareja con su finca desde la app usando el código que muestra el portal/serial.

// Secretos (credenciales MQTT y clave del portal). NO se versionan: viven en
// secrets.h, que está en .gitignore. Copia secrets.example.h -> secrets.h y
// rellena los valores reales antes de compilar.
#include "secrets.h"

// Portal cautivo — se abre solo si no hay WiFi guardado (o si falla la conexión)
// AP_PASSWORD lo define secrets.h
#define PORTAL_TIMEOUT_S  180           // Segundos que el portal espera antes de rendirse

// HiveMQ Cloud MQTT (compartido por todos los nodos)
// MQTT_USERNAME y MQTT_PASSWORD los define secrets.h
#define MQTT_HOST         "4fd28440312d4127bb4fc40a08d21e18.s1.eu.hivemq.cloud"
#define MQTT_PORT         8883

// Backend Surqo
#define API_BASE_URL      "https://surqo-api.fly.dev"

#define FIRMWARE_VERSION  "2.0.0"

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
#define SLEEP_MINUTES     1     // Deep sleep entre lecturas (min) — 1 para pruebas/demo (USB); usa 15-30 en batería/campo
#define SENSOR_WARMUP_MS  2000  // Tiempo de estabilización sensores (DHT22 necesita ~2s)
#define WIFI_TIMEOUT_MS   30000

// ADC averaging
#define ADC_SAMPLES       10    // Muestras para promediar ADC y reducir ruido
