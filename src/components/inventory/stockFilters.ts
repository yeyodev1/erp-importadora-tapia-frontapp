import { defaultFilters, type ReportFilterValues } from '@/components/report/filters'
import { useUserStore } from '@/stores/user'
import type { StockParams } from '@/services/inventory.service'

/** Filtros de saldos, toma y bajo mínimo: bodega obligatoria + grupo, subgrupo y proveedor. */
export interface StockFilterValues extends ReportFilterValues {
  groupId: string
  subgroup: string
}

/** Arranca en la bodega del usuario (la de su sesión), como el sistema de hoy. Llamar en setup. */
export function defaultStockFilters(): StockFilterValues {
  const user = useUserStore()
  return { ...defaultFilters({ warehouseId: user.user?.warehouseId ?? '' }), groupId: '', subgroup: '' }
}

/** El proveedor del filtro va en `partyId`; el API lo espera como `supplierId`. */
export function stockParams(v: StockFilterValues): StockParams {
  const out: StockParams = { warehouseId: v.warehouseId }
  if (v.groupId) out.groupId = v.groupId
  if (v.subgroup) out.subgroup = v.subgroup
  if (v.partyId) out.supplierId = v.partyId
  return out
}
