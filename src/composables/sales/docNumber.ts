/** "001-001-000012190" → serie "001-001" y número "000012190", como los muestra el sistema de hoy. */
export function splitNumber(number: string | undefined | null): { series: string; seq: string } {
  const m = /^(\d{3}-\d{3})-(\d+)$/.exec(number ?? '')
  return m ? { series: m[1]!, seq: m[2]! } : { series: '', seq: number ?? '' }
}
