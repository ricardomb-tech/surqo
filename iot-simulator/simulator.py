"""
Surqo IoT Simulator — Genera datos realistas de Córdoba, Colombia
Publica por MQTT a HiveMQ Cloud o por HTTP al API.

Uso:
    python simulator.py --device-id ESP32-SIM-001 --farm-id <uuid> --interval 30
    python simulator.py --mode http --interval 10
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False

try:
    import httpx
    HTTP_AVAILABLE = True
except ImportError:
    HTTP_AVAILABLE = False


# ─── Modelo climático de Córdoba ─────────────────────────────────────────────

@dataclass
class SimulatorState:
    soil_moisture: float = 55.0   # % — evoluciona durante el día
    last_rain: float = 0.0        # mm de lluvia simulada
    hour: int = 0
    day: int = 0


class CordobaClimateModel:
    """Modelo de ciclos climáticos de Montería, Córdoba, Colombia."""

    TEMP_MIN = 22.0   # Temperatura mínima nocturna (°C)
    TEMP_MAX = 34.0   # Temperatura máxima diurna (°C)
    TEMP_PEAK_HOUR = 14  # Hora del día con temperatura pico

    def temp_at_hour(self, hour: int) -> float:
        """Ciclo senoidal día/noche."""
        angle = math.pi * (hour - 5) / 9  # 5am mínimo, 2pm máximo
        if 5 <= hour <= 14:
            t = self.TEMP_MIN + (self.TEMP_MAX - self.TEMP_MIN) * math.sin(angle)
        else:
            hours_since_peak = hour - self.TEMP_PEAK_HOUR if hour >= self.TEMP_PEAK_HOUR else hour + 24 - self.TEMP_PEAK_HOUR
            decay = math.exp(-hours_since_peak / 8)
            t = self.TEMP_MIN + (self.TEMP_MAX - self.TEMP_MIN) * decay
        return round(t + random.uniform(-1.0, 1.0), 1)

    def humidity_at_hour(self, hour: int, temp: float) -> float:
        """Humedad inversa a temperatura."""
        base_humidity = 55.0 + (self.TEMP_MAX - temp) * 2.5
        return round(max(40.0, min(95.0, base_humidity + random.uniform(-5, 5))), 1)

    def should_rain(self, humidity: float) -> bool:
        """Lluvia aleatoria correlacionada con humedad alta."""
        if humidity > 85:
            return random.random() < 0.25
        elif humidity > 78:
            return random.random() < 0.10
        return False

    def uv_at_hour(self, hour: int) -> float:
        if hour < 7 or hour > 18:
            return 0.0
        angle = math.pi * (hour - 7) / 11
        return round(max(0.0, 11.0 * math.sin(angle) + random.uniform(-0.5, 0.5)), 1)


@dataclass
class SurqoSimulator:
    device_id: str = "ESP32-SIM-001"
    farm_id: str = str(uuid.uuid4())
    interval_seconds: int = 30
    mode: Literal["mqtt", "http"] = "mqtt"
    api_url: str = "https://surqo-api.onrender.com/api/v1/sensors/reading"
    mqtt_host: str = "broker.hivemq.com"
    mqtt_port: int = 8883
    mqtt_username: str = ""
    mqtt_password: str = ""

    state: SimulatorState = field(default_factory=SimulatorState)
    climate: CordobaClimateModel = field(default_factory=CordobaClimateModel)
    _mqtt_client: object | None = field(default=None, init=False, repr=False)

    def generate_reading(self) -> dict:
        now = datetime.now(timezone.utc)
        hour = now.hour - 5  # UTC-5 Colombia
        if hour < 0:
            hour += 24

        temp = self.climate.temp_at_hour(hour)
        humidity = self.climate.humidity_at_hour(hour, temp)
        uv = self.climate.uv_at_hour(hour)

        # Evolución de humedad del suelo
        if self.climate.should_rain(humidity):
            rain_amount = random.uniform(5, 25)
            self.state.soil_moisture = min(95.0, self.state.soil_moisture + rain_amount * 0.8)
            self.state.last_rain = rain_amount
        else:
            et_loss = (0.3 if 8 <= hour <= 18 else 0.05) * (self.interval_seconds / 1800)
            self.state.soil_moisture = max(5.0, self.state.soil_moisture - et_loss)
            self.state.last_rain = 0.0

        soil_temp = temp - 2.0 + random.uniform(-0.5, 0.5)
        battery_mv = int(3700 + random.uniform(-200, 200))

        return {
            "device_id": self.device_id,
            "farm_id": self.farm_id,
            "timestamp": now.strftime("%Y-%m-%dT%H:%M:%S-05:00"),
            "sensors": {
                "soil_moisture_pct": round(self.state.soil_moisture, 1),
                "soil_temp_c": round(soil_temp, 1),
                "air_temp_c": temp,
                "air_humidity_pct": humidity,
                "light_uv_index": uv,
            },
            "battery_mv": battery_mv,
            "rssi_dbm": int(random.uniform(-85, -45)),
            "firmware_version": "1.0.0-sim",
        }

    def _setup_mqtt(self) -> None:
        if not MQTT_AVAILABLE:
            print("❌ paho-mqtt no instalado. Instalar: pip install paho-mqtt")
            sys.exit(1)

        import ssl
        client = mqtt.Client(
            client_id=f"surqo-sim-{int(time.time())}",
            protocol=mqtt.MQTTv5,
        )
        if self.mqtt_username:
            client.username_pw_set(self.mqtt_username, self.mqtt_password)

        tls_ctx = ssl.create_default_context()
        client.tls_set_context(tls_ctx)
        client.connect(self.mqtt_host, self.mqtt_port, keepalive=60)
        client.loop_start()
        self._mqtt_client = client
        print(f"✅ MQTT conectado a {self.mqtt_host}:{self.mqtt_port}")

    def publish_mqtt(self, data: dict) -> bool:
        if self._mqtt_client is None:
            self._setup_mqtt()
        topic = f"surqo/farms/{self.farm_id}/sensors"
        result = self._mqtt_client.publish(topic, json.dumps(data), qos=1)
        return result.rc == 0

    def publish_http(self, data: dict) -> bool:
        if not HTTP_AVAILABLE:
            print("❌ httpx no instalado. Instalar: pip install httpx")
            sys.exit(1)
        # Convertir al formato HTTP del API
        sensors = data["sensors"]
        http_payload = {
            "device_id": data["device_id"],
            "farm_id": data.get("farm_id"),
            "soil_moisture_pct": sensors.get("soil_moisture_pct"),
            "soil_temp_c": sensors.get("soil_temp_c"),
            "air_temp_c": sensors.get("air_temp_c"),
            "air_humidity_pct": sensors.get("air_humidity_pct"),
            "uv_index": sensors.get("light_uv_index"),
            "battery_mv": data.get("battery_mv"),
            "rssi_dbm": data.get("rssi_dbm"),
            "source": "simulator",
            "firmware_version": data.get("firmware_version"),
        }
        try:
            resp = httpx.post(self.api_url, json=http_payload, timeout=5)
            return resp.status_code in (200, 201)
        except Exception as e:
            print(f"  HTTP error: {e}")
            return False

    def print_reading(self, data: dict, published: bool) -> None:
        sensors = data["sensors"]
        status = "✅" if published else "❌"
        print(
            f"\n{status} [{data['timestamp'][-14:-9]}] "
            f"Suelo: {sensors['soil_moisture_pct']:5.1f}% | "
            f"Aire: {sensors['air_temp_c']:4.1f}°C {sensors['air_humidity_pct']:4.1f}%HR | "
            f"UV: {sensors['light_uv_index']:4.1f} | "
            f"Bat: {data['battery_mv']}mV | "
            f"RSSI: {data['rssi_dbm']}dBm"
        )

    def run(self) -> None:
        print("🌾 Surqo IoT Simulator")
        print(f"   Device: {self.device_id}")
        print(f"   Farm:   {self.farm_id}")
        print(f"   Mode:   {self.mode.upper()}")
        print(f"   Interval: {self.interval_seconds}s")
        print("─" * 70)

        if self.mode == "mqtt":
            self._setup_mqtt()

        try:
            while True:
                data = self.generate_reading()
                if self.mode == "mqtt":
                    ok = self.publish_mqtt(data)
                else:
                    ok = self.publish_http(data)
                self.print_reading(data, ok)
                time.sleep(self.interval_seconds)
        except KeyboardInterrupt:
            print("\n\nSimulador detenido.")
            if self._mqtt_client:
                self._mqtt_client.loop_stop()
                self._mqtt_client.disconnect()


def main() -> None:
    parser = argparse.ArgumentParser(description="Surqo IoT Simulator")
    parser.add_argument("--device-id", default="ESP32-SIM-001")
    parser.add_argument("--farm-id", default=str(uuid.uuid4()))
    parser.add_argument("--interval", type=int, default=30, help="Segundos entre lecturas")
    parser.add_argument("--mode", choices=["mqtt", "http"], default="http")
    parser.add_argument("--api-url", default="https://surqo-api.onrender.com/api/v1/sensors/reading")
    parser.add_argument("--mqtt-host", default="broker.hivemq.com")
    parser.add_argument("--mqtt-port", type=int, default=8883)
    parser.add_argument("--mqtt-user", default="")
    parser.add_argument("--mqtt-pass", default="")
    args = parser.parse_args()

    sim = SurqoSimulator(
        device_id=args.device_id,
        farm_id=args.farm_id,
        interval_seconds=args.interval,
        mode=args.mode,
        api_url=args.api_url,
        mqtt_host=args.mqtt_host,
        mqtt_port=args.mqtt_port,
        mqtt_username=args.mqtt_user,
        mqtt_password=args.mqtt_pass,
    )
    sim.run()


if __name__ == "__main__":
    main()
