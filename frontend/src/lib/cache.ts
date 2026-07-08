// Caché en memoria muy simple, de vida igual a la pestaña (se pierde al recargar).
// El objetivo no es evitar la llamada de red (siempre se refresca), sino poder
// pintar la pantalla al instante con el último dato conocido mientras esa
// llamada corre en segundo plano — así se evita el parpadeo de "loading" al
// volver a una pantalla ya visitada en la misma sesión.

const store = new Map<string, unknown>()

export function getCached<T>(key: string): T | null {
  return store.has(key) ? (store.get(key) as T) : null
}

export function setCached<T>(key: string, data: T): T {
  store.set(key, data)
  return data
}

export function invalidateCached(prefix: string): void {
  for (const k of Array.from(store.keys())) {
    if (k === prefix || k.startsWith(`${prefix}:`)) store.delete(k)
  }
}
