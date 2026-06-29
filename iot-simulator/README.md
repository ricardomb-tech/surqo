# Surqo IoT Simulator

Genera lecturas realistas de sensores ESP32 con el modelo climático de Córdoba, Colombia. Útil para desarrollo y testing sin hardware físico.

## Instalación

```bash
cd iot-simulator
pip install httpx paho-mqtt
```

## Uso

### Modo HTTP (publicar al API directamente)

```bash
# API local (desarrollo)
python simulator.py --mode http \
  --api-url http://localhost:8000/api/v1/sensors/readings \
  --farm-id tu-farm-uuid \
  --device-id ESP32-DEMO-001 \
  --interval 10

# API de producción
python simulator.py --mode http \
  --api-url https://surqo-api.fly.dev/api/v1/sensors/readings \
  --farm-id tu-farm-uuid \
  --interval 30
```

### Modo MQTT (publicar al broker HiveMQ)

```bash
python simulator.py --mode mqtt \
  --mqtt-host tu-cluster.hivemq.cloud \
  --mqtt-user surqo-user \
  --mqtt-pass tu_password \
  --farm-id tu-farm-uuid \
  --device-id ESP32-DEMO-001 \
  --interval 15
```

## Parámetros

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `--mode` | `http` | `http` o `mqtt` |
| `--interval` | `15` | Segundos entre lecturas |
| `--farm-id` | Requerido | UUID de la finca en Surqo |
| `--device-id` | `ESP32-SIM-001` | ID del dispositivo simulado |
| `--api-url` | `http://localhost:8000/api/v1/sensors/readings` | Endpoint HTTP |
| `--mqtt-host` | — | Host HiveMQ Cloud |
| `--mqtt-user` | — | Usuario MQTT |
| `--mqtt-pass` | — | Password MQTT |

## Modelo climático simulado (Córdoba, Colombia)

| Variable | Modelo |
|----------|--------|
| **Temperatura aire** | Ciclo senoidal 22°C (5am) → 34°C (2pm) + ruido ±1°C |
| **Humedad relativa** | Inversa a temperatura: 55% (2pm) → 90% (5am) |
| **Humedad suelo** | Decrece por evapotranspiración, sube con lluvia probabilística |
| **Temperatura suelo** | Desfasada 2h respecto al aire, rango 24–32°C |
| **Índice UV** | Ciclo solar, pico ~11 UV al mediodía, 0 de noche |
| **Batería** | Descarga lineal lenta de 4200mV → 3200mV |
| **Lluvia** | Probabilística: se activa cuando HR > 82% |

## Formato del payload enviado

```json
{
  "device_id": "ESP32-SIM-001",
  "farm_id": "uuid-de-la-finca",
  "sensors": {
    "soil_moisture_pct": 44.5,
    "soil_temp_c": 27.8,
    "air_temp_c": 31.2,
    "air_humidity_pct": 70.1,
    "light_uv_index": 7.4
  },
  "battery_mv": 3850,
  "rssi_dbm": -62,
  "firmware_version": "sim-1.0.0"
}
```

Este schema es idéntico al del firmware ESP32 real.
