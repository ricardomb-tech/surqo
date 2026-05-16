"""Day 4 — test MQTT flow end-to-end.

1. Crea una finca en Supabase (via SQLAlchemy)
2. Publica 3 lecturas MQTT simuladas
3. El backend consumer las recibe y guarda en DB
4. Verifica que aparecen en Supabase
"""
import asyncio
import json
import ssl
import time
import uuid

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

from app.database import AsyncSessionLocal, init_db
from app.models.farm import Farm
from app.models.sensor_reading import SensorReading
from app.services.mqtt_service import SurqoMQTTService
from app.websocket.manager import manager
from app.config import settings
from sqlalchemy import select


FARM_ID = uuid.uuid4()
DEVICE_ID = "ESP32-SIM-001"


async def create_farm() -> Farm:
    async with AsyncSessionLocal() as db:
        farm = Farm(
            id=FARM_ID,
            name="Finca Test MQTT",
            owner_name="Ricardo",
            latitude=8.7575,
            longitude=-75.8891,
            area_hectares=12.5,
            crop_type="maiz",
        )
        db.add(farm)
        await db.commit()
        await db.refresh(farm)
        print(f"Finca creada: {farm.id} — {farm.name}")
        return farm


def publish_readings(farm_id: str, n: int = 3) -> list[dict]:
    published = []

    client = mqtt.Client(
        client_id=f"surqo-test-{int(time.time())}",
        protocol=mqtt.MQTTv5,
    )
    client.username_pw_set(settings.HIVEMQ_USERNAME, settings.HIVEMQ_PASSWORD)
    client.tls_set_context(ssl.create_default_context())
    client.connect(settings.HIVEMQ_HOST, settings.HIVEMQ_PORT, keepalive=30)
    client.loop_start()
    time.sleep(2)

    for i in range(n):
        payload = {
            "device_id": DEVICE_ID,
            "farm_id": farm_id,
            "sensors": {
                "soil_moisture_pct": 42.0 + i * 2,
                "soil_temp_c": 28.5,
                "air_temp_c": 32.0 + i,
                "air_humidity_pct": 70.0 - i,
                "light_uv_index": 6.5,
            },
            "battery_mv": 3800,
            "rssi_dbm": -65,
            "firmware_version": "1.0.0-sim",
        }
        topic = f"surqo/farms/{farm_id}/sensors"
        result = client.publish(topic, json.dumps(payload), qos=1)
        ok = result.rc == 0
        published.append(payload)
        print(f"  Publicado #{i+1}: suelo={payload['sensors']['soil_moisture_pct']}% | "
              f"aire={payload['sensors']['air_temp_c']}°C | {'OK' if ok else 'FAIL'}")
        time.sleep(1)

    client.loop_stop()
    client.disconnect()
    return published


async def start_consumer_and_process(farm_id: str, payloads: list[dict]):
    """Simula el consumer del backend procesando los mensajes."""
    loop = asyncio.get_event_loop()
    svc = SurqoMQTTService(
        db_session_factory=AsyncSessionLocal,
        ws_manager=manager,
        loop=loop,
    )
    topic = f"surqo/farms/{farm_id}/sensors"
    print(f"\nProcesando {len(payloads)} lecturas MQTT via consumer...")
    for payload in payloads:
        await svc._process_reading(payload, farm_id)
    print("  Consumer procesó todas las lecturas")


async def verify_in_db(farm_id: str) -> int:
    async with AsyncSessionLocal() as db:
        stmt = select(SensorReading).where(
            SensorReading.farm_id == uuid.UUID(farm_id),
            SensorReading.source == "mqtt",
        )
        result = await db.execute(stmt)
        readings = result.scalars().all()
        print(f"\nLecturas en Supabase (source=mqtt, farm={farm_id[:8]}...): {len(readings)}")
        for r in readings:
            print(f"  device={r.device_id} | suelo={r.soil_moisture_pct}% | "
                  f"aire={r.air_temp_c}°C | vpd={r.vpd_kpa} kPa")
        return len(readings)


async def main():
    print("=" * 60)
    print("Day 4 — MQTT Flow End-to-End Test")
    print("=" * 60)

    await init_db()

    # 1. Crear finca
    print("\n[1] Creando finca en Supabase...")
    await create_farm()

    # 2. Publicar a HiveMQ
    print(f"\n[2] Publicando {3} lecturas a HiveMQ Cloud...")
    payloads = publish_readings(str(FARM_ID), n=3)

    # 3. Consumer procesa los mensajes
    print("\n[3] Consumer del backend procesando mensajes...")
    await start_consumer_and_process(str(FARM_ID), payloads)

    # 4. Verificar en Supabase
    print("\n[4] Verificando lecturas en Supabase...")
    count = await verify_in_db(str(FARM_ID))

    print("\n" + "=" * 60)
    if count >= 3:
        print(f"Day 4 COMPLETADO — {count} lecturas MQTT guardadas en Supabase")
    else:
        print(f"Parcial — solo {count}/3 lecturas encontradas")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
