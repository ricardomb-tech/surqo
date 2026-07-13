#pragma once

// ═══════════════════════════════════════════════════════════════════
// PLANTILLA DE SECRETOS DEL NODO
// Copia este archivo como secrets.h y rellena los valores reales.
//   cp secrets.example.h secrets.h
// secrets.h está en .gitignore y NUNCA se sube al repo.
// ═══════════════════════════════════════════════════════════════════

// Clave para conectarse a la red de configuración (portal cautivo)
#define AP_PASSWORD       "cambia-esta-clave"

// Credenciales HiveMQ Cloud MQTT (compartidas por todos los nodos)
#define MQTT_USERNAME     "<usuario-hivemq>"
#define MQTT_PASSWORD     "<password-hivemq>"
