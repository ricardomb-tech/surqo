#include <Arduino.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define DHT_PIN 4
#define DS18B20_PIN 5
#define SOIL_PIN 32
#define SENSOR_POWER_PIN 25

DHT dht(DHT_PIN, DHT22);
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== Prueba aislada DHT22 + DS18B20 ===");

  pinMode(SENSOR_POWER_PIN, OUTPUT);
  digitalWrite(SENSOR_POWER_PIN, HIGH);
  Serial.println("Energizando sensores, esperando 2s...");
  delay(2000);

  dht.begin();
  ds18b20.begin();
  ds18b20.setResolution(12);
  Serial.println("listo, iniciando lecturas cada 3s...\n");
}

void loop() {
  delay(3000);

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("DHT22   -> FALLIDA (nan)");
  } else {
    Serial.printf("DHT22   -> OK temp=%.1fC hum=%.1f%%\n", t, h);
  }

  ds18b20.requestTemperatures();
  float soilT = ds18b20.getTempCByIndex(0);
  if (soilT == DEVICE_DISCONNECTED_C) {
    Serial.println("DS18B20 -> FALLIDA (desconectado)");
  } else {
    Serial.printf("DS18B20 -> OK temp=%.1fC\n", soilT);
  }

  int rawSoil = analogRead(SOIL_PIN);
  Serial.printf("SEN2211 -> ADC crudo=%d\n", rawSoil);
}
