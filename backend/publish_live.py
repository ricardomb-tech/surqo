"""Publica lecturas MQTT en vivo para ver el dashboard en tiempo real."""
import ssl, time, json
from dotenv import load_dotenv
load_dotenv()

import paho.mqtt.client as mqtt
from app.config import settings

FARM_ID = "310f2f64-4faf-4552-bc13-e9964e1cfccb"

client = mqtt.Client(
    client_id="surqo-live-demo",
    protocol=mqtt.MQTTv5,
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
)
client.username_pw_set(settings.HIVEMQ_USERNAME, settings.HIVEMQ_PASSWORD)
client.tls_set_context(ssl.create_default_context())
client.connect(settings.HIVEMQ_HOST, settings.HIVEMQ_PORT, keepalive=30)
client.loop_start()
time.sleep(2)

print("Publicando 5 lecturas cada 3s — abre http://localhost:3000/dashboard")
print("-" * 55)

for i in range(5):
    payload = {
        "device_id": "ESP32-SIM-001",
        "farm_id": FARM_ID,
        "sensors": {
            "soil_moisture_pct": round(44.0 + i * 1.5, 1),
            "soil_temp_c": 28.0,
            "air_temp_c": round(31.0 + i * 0.5, 1),
            "air_humidity_pct": round(71.0 - i, 1),
            "light_uv_index": 7.2,
        },
        "battery_mv": 3820,
        "rssi_dbm": -62,
        "firmware_version": "1.0.0-sim",
    }
    topic = f"surqo/farms/{FARM_ID}/sensors"
    result = client.publish(topic, json.dumps(payload), qos=1)
    moisture = payload["sensors"]["soil_moisture_pct"]
    temp = payload["sensors"]["air_temp_c"]
    status = "OK" if result.rc == 0 else "FAIL"
    print(f"  [{i+1}/5] suelo={moisture}% aire={temp}C -> {status}")
    time.sleep(3)

client.loop_stop()
client.disconnect()
print("\nVerifica el Live Feed en http://localhost:3000/dashboard")
