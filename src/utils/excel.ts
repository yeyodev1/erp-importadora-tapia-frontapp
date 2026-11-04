import type { Cell } from 'write-excel-file/browser'

export type XlsxValue = string | number | Date | null | undefined

/**
 * Descarga un .xlsx real y no un CSV: Excel en español lee mal los decimales
 * de un CSV. La librería se carga recién al exportar. `formats` da el formato
 * numérico por columna ('#,##0.00' para dinero, '#,##0.0000' para cantidad).
 */
export async function downloadXlsx(
  fileName: string,
  header: string[],
  rows: XlsxValue[][],
  formats: (string | undefined)[] = [],
) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const cell = (value: XlsxValue, col: number): Cell =>
    value == null || value === ''
      ? null
      : typeof value === 'number'
        ? { value, format: formats[col] ?? '#,##0.00' }
        : value instanceof Date
          ? { value, format: 'dd/mm/yyyy' }
          : value
  await writeExcelFile(
    [header.map((h) => ({ value: h, fontWeight: 'bold' as const })), ...rows.map((r) => r.map(cell))],
    {
      columns: header.map((h) => ({ width: Math.max(12, h.length + 2) })),
      stickyRowsCount: 1,
    },
  ).toFile(`${fileName}.xlsx`)
}
