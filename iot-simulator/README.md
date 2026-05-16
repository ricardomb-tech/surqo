# Surqo IoT Simulator

Genera lecturas realistas de sensores ESP32 con el modelo climático de Córdoba, Colombia.

## Instalación

```bash
pip install httpx paho-mqtt
```

## Uso

```bash
# Publicar por HTTP al API local
python simulator.py --mode http --interval 10 --api-url http://localhost:8000/api/v1/sensors/reading

# Publicar por MQTT a HiveMQ Cloud
python simulator.py --mode mqtt \
  --mqtt-host tu-cluster.hivemq.cloud \
  --mqtt-user surqo-user \
  --mqtt-pass tu_password \
  --farm-id tu-farm-uuid

# Con device y farm específicos
python simulator.py --device-id ESP32-DEMO-001 --farm-id <uuid> --interval 30
```

## Modelo climático

- Temperatura: ciclo senoidal 22°C (5am) → 34°C (2pm)
- Humedad: inversa a temperatura (55%–90%)
- Lluvia: probabilística, correlacionada con HR>82%
- Humedad suelo: decrece por evapotranspiración, sube con lluvia
- UV: ciclo solar, pico al mediodía (~11 UV)
