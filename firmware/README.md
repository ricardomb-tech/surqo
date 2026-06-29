# Surqo Node — Firmware ESP32

Firmware para el nodo sensor de campo de Surqo. Lee 5 sensores cada 15 minutos, publica por MQTT TLS a HiveMQ Cloud y entra en deep sleep para maximizar autonomía de batería.

## Requisitos

- [PlatformIO](https://platformio.org/) (IDE o CLI)
- ESP32 WROOM-32 DevKit (38 pines)
- Python 3.8+ (para `pio` CLI)

## Hardware necesario

| Componente | Especificación | Precio aprox. |
|-----------|---------------|-------------|
| ESP32 WROOM-32 DevKit | 38 pines, dual-core 240MHz | $4 USD |
| **DHT22** (AM2302) | Temp/Humedad aire ±0.5°C — **NO usar DHT11** | $2 USD |
| DS18B20 waterproof | Temp suelo, sonda metálica impermeable | $2 USD |
| Sensor capacitivo suelo v2.0 | Negro, no metálico (no se oxida) | $1.5 USD |
| ML8511 | Índice UV 0–11+ | $2 USD |
| 2× batería 18650 Li-Ion 2000mAh | Autonomía ~2 semanas con deep sleep | $4 USD |
| Módulo TP4056 con protección | Cargador USB (4 pines de salida) | $1 USD |
| Resistencia 10kΩ | Pull-up OneWire para DS18B20 | $0.10 USD |
| 2× resistencia 100kΩ | Divisor de voltaje para batería ADC | $0.10 USD |
| Caja IP65 (~100×68×50mm) | Protección lluvia y polvo en campo | $2 USD |

**Total estimado: ~$15–18 USD por nodo**

## Conexiones GPIO

| Sensor | Pin ESP32 | Notas |
|--------|-----------|-------|
| DHT22 DATA | GPIO 4 | VCC → 3.3V · GND → GND |
| DS18B20 DATA | GPIO 5 | + resistencia 10kΩ entre DATA y 3.3V |
| Capacitive soil AOUT | GPIO 32 | ADC1_CH4 — VCC → GPIO25 |
| ML8511 OUT | GPIO 34 | ADC1_CH6 — solo entrada |
| Battery voltage | GPIO 35 | ADC1_CH7 — divisor 100kΩ + 100kΩ |
| Sensor power control | GPIO 25 | VCC de todos los sensores — se corta en sleep |

> **Importante:** GPIO 34, 35, 36, 39 son **solo entrada** en el ESP32. No conectar como salidas.

> **Ahorro de energía:** Conectar el VCC de todos los sensores al GPIO 25 (no a 3.3V directo). El firmware lo apaga antes del deep sleep, ahorrando ~20mA durante el reposo.

## Configuración

Editar `surqo_node/config.h`:

```cpp
// WiFi
#define WIFI_SSID         "nombre-de-tu-red"
#define WIFI_PASSWORD     "clave-wifi"
#define WIFI_TIMEOUT_MS   30000

// HiveMQ Cloud MQTT — puerto TLS 8883
#define MQTT_HOST         "xxxxxxxx.s1.eu.hivemq.cloud"
#define MQTT_PORT         8883
#define MQTT_USERNAME     "surqo-device"
#define MQTT_PASSWORD     "password-seguro"
#define MQTT_CLIENT_ID    "surqo-node-001"

// Identidad del nodo — obtener farm_id del dashboard Surqo
#define DEVICE_ID         "surqo-esp32-001"
#define FARM_ID           "uuid-de-la-finca"
#define FIRMWARE_VERSION  "1.0.0"

// Pines (no cambiar si usas el esquema de conexiones de arriba)
#define DHT_PIN           4
#define DS18B20_PIN       5
#define SOIL_MOISTURE_PIN 32
#define UV_SENSOR_PIN     34
#define BATTERY_PIN       35
#define SENSOR_POWER_PIN  25

// Calibración del sensor capacitivo (calibrar en TU suelo)
// Medir ADC raw con suelo seco y con suelo saturado
#define SOIL_DRY_ADC      3200
#define SOIL_WET_ADC      1200

// Intervalo de lectura
#define SLEEP_MINUTES     15
```

## Compilar y subir firmware

```bash
# Clonar el repo
git clone https://github.com/ricardomb-tech/surqo.git
cd surqo/firmware

# Compilar
pio run

# Subir al ESP32 (conectado por USB)
pio run -t upload

# Ver logs por serial
pio device monitor --baud 115200
```

## Flujo de operación

```
Despertar (timer RTC cada 15 minutos)
  │
  ├─ GPIO25 HIGH → enciende todos los sensores
  ├─ delay 500ms → estabilización
  │
  ├─ DHT22: promedio de 3 lecturas válidas (temp aire, humedad)
  ├─ DS18B20: temperatura suelo (resolución 12-bit, ~750ms)
  ├─ Capacitivo: 10 muestras ADC promediadas → % humedad
  ├─ ML8511: 10 muestras ADC → índice UV
  ├─ ADC batería: 10 muestras → voltaje mV
  │
  ├─ Conectar WiFi (timeout 30s)
  ├─ Sincronizar NTP (UTC-5 Colombia)
  │
  ├─ Intentar MQTT TLS (puerto 8883)
  │     ├─ OK: publicar JSON en topic surqo/farms/{FARM_ID}/sensors
  │     └─ Fallo: HTTP POST a https://surqo-api.fly.dev/api/v1/sensors/readings
  │
  ├─ GPIO25 LOW → apaga sensores
  ├─ Desconectar WiFi
  │
  └─ Deep sleep 15 minutos (~10µA consumo)
```

## Payload MQTT / HTTP

```json
{
  "device_id": "surqo-esp32-001",
  "farm_id": "uuid-de-la-finca",
  "timestamp": "2026-06-28T10:30:00-05:00",
  "firmware_version": "1.0.0",
  "battery_mv": 3850,
  "rssi_dbm": -62,
  "sensors": {
    "soil_moisture_pct": 44.5,
    "soil_temp_c": 27.8,
    "air_temp_c": 31.2,
    "air_humidity_pct": 70.1,
    "light_uv_index": 7.4
  }
}
```

## Calibración del sensor de humedad de suelo

El sensor capacitivo devuelve valores ADC crudos que varían según el suelo específico. Es obligatorio calibrar:

1. Con el suelo **completamente seco**: medir el ADC raw → asignar a `SOIL_DRY_ADC`
2. Con el suelo **saturado de agua**: medir el ADC raw → asignar a `SOIL_WET_ADC`

Ver los valores en el monitor serial al arrancar el nodo.

## Autonomía de batería estimada

| Configuración | Consumo activo | Consumo sleep | Autonomía (2× 18650) |
|--------------|---------------|--------------|----------------------|
| SLEEP_MINUTES=15 | ~200mA (~15s) | ~10µA | ~2 semanas |
| SLEEP_MINUTES=30 | ~200mA (~15s) | ~10µA | ~4 semanas |

## Librerías utilizadas (platformio.ini)

```ini
lib_deps =
    knolleary/PubSubClient@^2.8        ; MQTT cliente
    bblanchon/ArduinoJson@^7.0.0       ; Serialización JSON
    adafruit/DHT sensor library@^1.4.6 ; DHT22
    adafruit/Adafruit Unified Sensor@^1.1.14
    milesburton/DallasTemperature@^3.11.0 ; DS18B20
    paulstoffregen/OneWire@^2.3.8
```
