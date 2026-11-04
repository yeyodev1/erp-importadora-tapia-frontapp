import type { Product } from '@/types'

/** Producto en edición: los números pueden quedar vacíos (null) mientras se escribe. */
export interface ProductForm {
  code: string
  barcode: string
  name: string
  kind: 'bien' | 'servicio'
  groupId: string
  subgroup: string
  supplierId: string
  location: string
  unit: string
  purchaseUnit: { name: string; factor: number | null }
  minQty: number | null
  controlsStock: boolean
  controlsLot: boolean
  vatRate: 0 | 5 | 15
  prices: { list: string; price: number | null }[]
  imageUrl: string
  isActive: boolean
}

export function blankProduct(): ProductForm {
  return {
    code: '',
    barcode: '',
    name: '',
    kind: 'bien',
    groupId: '',
    subgroup: '',
    supplierId: '',
    location: '',
    unit: 'LIBRAS',
    purchaseUnit: { name: 'SACOS', factor: 100 },
    minQty: 0,
    controlsStock: true,
    controlsLot: false,
    vatRate: 0,
    prices: [{ list: 'GENERAL', price: null }],
    imageUrl: '',
    isActive: true,
  }
}

export function productToForm(p: Product): ProductForm {
  return {
    ...blankProduct(),
    ...p,
    groupId: typeof p.groupId === 'string' ? p.groupId : p.groupId?._id ?? '',
    supplierId: p.supplierId ?? '',
    purchaseUnit: { ...p.purchaseUnit },
    prices: p.prices.map((x) => ({ ...x })),
  }
}

/** Formulario → cuerpo del API: sin vacíos, precios en centavos enteros. */
export function formToProduct(f: ProductForm): Partial<Product> {
  return {
    ...f,
    code: f.code.trim(),
    supplierId: f.supplierId || null,
    purchaseUnit: { name: f.purchaseUnit.name.trim().toUpperCase(), factor: f.purchaseUnit.factor || 1 },
    unit: f.unit.trim().toUpperCase(),
    minQty: f.minQty ?? 0,
    controlsStock: f.kind === 'servicio' ? false : f.controlsStock,
    prices: f.prices
      .filter((x) => x.list.trim() && x.price != null)
      .map((x) => ({ list: x.list.trim().toUpperCase(), price: Math.round(x.price!) })),
  }
}
