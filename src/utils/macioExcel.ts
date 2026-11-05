/**
 * Reportes de Macio exportados a Excel (.xls): "Plan de cuentas" y "Reporte
 * de Proveedores por tipo". Son reportes impresos pasados a hoja: títulos,
 * encabezados repetidos en cada página y columnas que no calzan exacto con su
 * encabezado. Aquí se sacan las filas de datos; el back valida e importa.
 */
export type Cells = string[][]

const text = (v: unknown) => String(v ?? '').trim()
const plain = (v: unknown) => text(v).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const filled = (row: string[]) => row.map((v, i) => [i, text(v)] as const).filter(([, v]) => v)

/** Primera hoja como matriz de textos (SheetJS se carga solo cuando se sube un Excel). */
export async function readSheet(file: File): Promise<Cells> {
  const XLSX = await import('xlsx')
  const book = XLSX.read(await file.arrayBuffer())
  const sheet = book.Sheets[book.SheetNames[0]!]!
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' })
}

export const isExcel = (file: File) => /\.xlsx?$/i.test(file.name)

const ACCOUNT_CODE = /^\d(\.\d{1,3})*$/
/** "1.1.01. . . ." → "1.1.01"; null si no es un código de cuenta. */
export function accountCode(raw: string): string | null {
  if (!/^\d[\d\s.]*$/.test(raw)) return null
  const code = raw.replace(/\s+/g, '').replace(/\.+$/, '')
  return ACCOUNT_CODE.test(code) ? code : null
}

/**
 * Plan de cuentas → CSV "código;nombre;tipo" del importador. El tipo sale de
 * la "X": Macio marca Mayor en una columna y Movimiento en otra más a la
 * derecha. Sin X, es de mayor si tiene subcuentas.
 */
export function chartCsvFromCells(cells: Cells): { csv: string; count: number } {
  const rows = cells.flatMap((row) => {
    const [first, ...rest] = filled(row)
    const code = first && accountCode(first[1])
    const x = rest.findIndex(([, v]) => v === 'X')
    // El nombre va antes de la X (después viene el "Tipo"); se salta la "Clave" numérica.
    const name = (x < 0 ? rest : rest.slice(0, x)).find(([, v]) => !/^\d+$/.test(v))?.[1]
    return code && name ? [{ code, name: name.replace(/;/g, ','), x: rest[x]?.[0] }] : []
  })
  const xCols = [...new Set(rows.map((r) => r.x).filter((x) => x !== undefined))].sort((a, b) => a - b)
  const parents = new Set(rows.map((r) => r.code.slice(0, r.code.lastIndexOf('.'))))
  const kindOf = (r: (typeof rows)[number]) =>
    xCols.length === 2 && r.x !== undefined ? (r.x === xCols[0] ? 'mayor' : 'movimiento') : parents.has(r.code) ? 'mayor' : 'movimiento'
  return { csv: rows.map((r) => `${r.code};${r.name};${kindOf(r)}`).join('\n'), count: rows.length }
}

export interface SupplierCells {
  line: number
  name: string
  identification: string
  address: string
  phone: string
  email: string
}

const SUPPLIER_HEADERS: [keyof Omit<SupplierCells, 'line'>, RegExp][] = [
  ['name', /^(PROVEEDOR|NOMBRE|RAZON SOCIAL)/],
  ['identification', /^(IDENTIFICACION|RUC|CEDULA)/],
  ['address', /^DIRECCION/],
  ['phone', /^TELEFONO/],
  ['email', /^(EMAIL|CORREO)/],
]

/** Listado de proveedores: cada dato va a la columna de encabezado más cercana (Macio corre algunas columnas). */
export function suppliersFromCells(cells: Cells): SupplierCells[] {
  const headerAt = cells.findIndex((row) => row.some((v) => /^IDENTIFICACION/.test(plain(v))))
  if (headerAt < 0) return []
  const headers = SUPPLIER_HEADERS.flatMap(([key, re]) => {
    const col = cells[headerAt]!.findIndex((v) => re.test(plain(v)))
    return col >= 0 ? [{ key, col }] : []
  })
  if (!headers.some((h) => h.key === 'name')) return []
  return cells.slice(headerAt + 1).flatMap((row, i) => {
    const values = filled(row)
    if (values.length < 2 || values.some(([, v]) => /^IDENTIFICACION/.test(plain(v)))) return [] // títulos, pie de página, encabezado repetido
    const out: SupplierCells = { line: headerAt + i + 2, name: '', identification: '', address: '', phone: '', email: '' }
    for (const [col, v] of values) {
      const near = [...headers].sort((a, b) => Math.abs(a.col - col) - Math.abs(b.col - col))[0]!
      const key = v.includes('@') ? 'email' : near.key
      out[key] ||= v
    }
    return out.name && out.identification ? [out] : [] // "Total de Registros : 1486" y otros pies
  })
}

/** Qué reporte de Macio es, por su título. */
export function macioReportKind(cells: Cells): 'plan' | 'proveedores' | null {
  const titles = cells.slice(0, 20).flat().map(plain)
  if (titles.some((t) => t.startsWith('PLAN DE CUENTAS'))) return 'plan'
  if (titles.some((t) => t.includes('PROVEEDORES'))) return 'proveedores'
  return null
}
