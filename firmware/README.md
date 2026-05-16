# Surqo Node — Firmware ESP32

## Requisitos

- PlatformIO IDE o PlatformIO CLI
- ESP32 DevKit v1

## Configuración

1. Copiar `surqo_node/config.h` y editar:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `MQTT_HOST` / `MQTT_USERNAME` / `MQTT_PASSWORD` (HiveMQ Cloud)
   - `DEVICE_ID` / `FARM_ID`
   - Calibración del sensor capacitivo (`SOIL_DRY_ADC`, `SOIL_WET_ADC`)

2. Compilar y subir:
   ```bash
   pio run -t upload
   pio device monitor
   ```

## Conexiones

| Sensor | Pin ESP32 | Descripción |
|--------|-----------|-------------|
| DHT22 DATA | GPIO4 | Temperatura/Humedad aire |
| DS18B20 DATA | GPIO5 | Temperatura suelo (OneWire) |
| Capacitive Soil AOUT | GPIO32 | Humedad suelo (ADC1_CH4) |
| ML8511 OUT | GPIO34 | Índice UV (ADC1_CH6) |
| Battery divider | GPIO35 | Nivel batería (ADC1_CH7) |
| Sensor power | GPIO25 | Control de energía sensores |

## Flujo de operación

```
Despertar deep sleep → WiFi → NTP → Sensores → MQTT TLS → Deep sleep 15min
                                              ↘ Fallback HTTP si MQTT falla
```
