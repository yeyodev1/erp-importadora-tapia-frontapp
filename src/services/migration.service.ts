import APIBase from './httpBase'
import type { DemoPreview, ImportBatch, MacioApplyResult, MacioPreview, SuppliersPreview } from '@/types'

/** Migración de datos (solo gerencia). Importar y quitar graban miles de registros: más plazo que el normal. */
const LONG = { timeout: 120000 }

class MigrationService extends APIBase {
  private async send<T>(endpoint: string, body: unknown = {}) {
    return (await this.post<T>(`migration/${endpoint}`, body, undefined, LONG)).data
  }

  macioPreview(data: unknown) {
    return this.send<MacioPreview>('macio/preview', { data })
  }

  macioApply(data: unknown) {
    return this.send<MacioApplyResult>('macio/apply', { data })
  }

  suppliersPreview() {
    return this.send<SuppliersPreview>('proveedores/preview')
  }

  suppliersApply() {
    return this.send<{ batch: ImportBatch }>('proveedores/apply')
  }

  demoPreview() {
    return this.send<DemoPreview>('demo/preview')
  }

  demoApply() {
    return this.send<DemoPreview>('demo/apply')
  }

  async batches() {
    return (await this.get<ImportBatch[]>('migration/batches')).data
  }

  undo(id: string, reason: string) {
    return this.send<ImportBatch>(`batches/${id}/undo`, { reason })
  }
}

export const migrationService = new MigrationService()
