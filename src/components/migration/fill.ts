/** "Se crean {n} clientes" + { n: 3 } → "Se crean 3 clientes". */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''))
}
