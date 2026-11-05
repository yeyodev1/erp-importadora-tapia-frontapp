/**
 * Copia profunda para formularios editables. `structuredClone` falla con los
 * objetos reactivos de Vue/Pinia (son Proxy: "could not be cloned"); los datos
 * del API son JSON puro (fechas como texto), así que JSON los copia completos.
 */
export function cloneData<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T)
}
