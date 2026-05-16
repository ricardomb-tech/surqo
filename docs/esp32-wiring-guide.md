# Guía de conexiones — Nodo Surqo ESP32

## Componentes necesarios

| Componente | Modelo | Precio aprox. |
|-----------|--------|--------------|
| Microcontrolador | ESP32 DevKit v1 | $3-5 USD |
| Temp/Humedad aire | DHT22 (AM2302) | $1-2 USD |
| Temp suelo | DS18B20 Waterproof | $1-2 USD |
| Humedad suelo | Capacitive v2.0 | $1 USD |
| Índice UV | ML8511 | $1-2 USD |
| Resistencias | 4.7kΩ, 100kΩ x2 | <$0.10 |

**Total: ~$8-13 USD**

## Diagrama de conexiones

```
ESP32 DevKit v1
                            3V3 ──── DHT22 VCC
                            GND ──── DHT22 GND
                           GPIO4 ──── DHT22 DATA (+ 10kΩ pullup a 3V3)

                            3V3 ──── DS18B20 VCC (cable rojo)
                            GND ──── DS18B20 GND (cable negro)
                           GPIO5 ──── DS18B20 DATA (cable amarillo, + 4.7kΩ pullup a 3V3)

                            3V3 ──── Capacitive Soil VCC
                            GND ──── Capacitive Soil GND
                           GPIO32 ──── Capacitive Soil AOUT

                            3V3 ──── ML8511 3V3
                            GND ──── ML8511 GND
                           GPIO34 ──── ML8511 OUT
                            3V3 ──── ML8511 EN

                      BATERÍA+ ──── 100kΩ ──┬──── GPIO35
                                            100kΩ
                                             │
                                           GND

                           GPIO25 ──── Transistor/MOSFET → VCC sensores
                                       (cortar energía durante deep sleep)
```

## Calibración sensor capacitivo

1. Medir ADC raw con el sensor en aire seco → anotar como `SOIL_DRY_ADC`
2. Sumergir el sensor en agua → anotar como `SOIL_WET_ADC`  
3. Actualizar valores en `config.h`

Los valores típicos son:
- Seco (aire): ~3200 ADC
- Saturado (agua): ~1200 ADC

## Primer encendido

```bash
# 1. Abrir Monitor Serial
pio device monitor -b 115200

# 2. Debería ver:
# ═══════════════════════════════════
#   SURQO NODE v1.0.0
#   Del surco al insight
# ═══════════════════════════════════
# 📶 Conectando a TU_RED_WIFI... ✅
# 📡 Conectando MQTT a tu-cluster.hivemq.cloud... ✅
# 📊 Lectura actual:
#   Suelo: 45.2% humedad | 27.8°C
#   Aire:  31.4°C | 68.0% HR
#   UV:    6.8 | Batería: 3890mV
# ✅ Publicado por MQTT
# 💤 Deep sleep 15 min...
```
