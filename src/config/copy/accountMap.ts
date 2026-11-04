import type { AccountMapKey } from '@/types'

/**
 * Mapa contable: a qué cuenta va cada concepto que generan los módulos.
 * Nombre claro + ayuda de cuándo se usa; el orden es el de la pantalla.
 */
export const accountMap = {
  title: 'Mapa contable',
  intro:
    'Cada documento arma su asiento solo. Aquí se define a qué cuenta de movimiento va cada concepto. Las cuentas de inventario, ventas y costo se definen por grupo de producto.',
  groups: [
    { title: 'Clientes y proveedores', keys: ['customers', 'suppliers', 'customerAdvances', 'supplierAdvances'] },
    { title: 'IVA', keys: ['vatSales', 'vatPurchases'] },
    {
      title: 'Retenciones',
      keys: ['withheldIncomeReceivable', 'withheldVatReceivable', 'incomeWithholdingPayable', 'vatWithholdingPayable'],
    },
    { title: 'Cobros y bancos', keys: ['postdatedChecks', 'depositsInTransit'] },
    { title: 'Inventario y ventas', keys: ['inventoryAdjustment', 'salesDiscounts'] },
    { title: 'Cierre del año', keys: ['yearResult', 'retainedEarnings'] },
  ] as { title: string; keys: AccountMapKey[] }[],
  keys: {
    customers: {
      label: 'Clientes (cuentas por cobrar)',
      help: 'Se debita al facturar y se acredita al cobrar o aplicar una nota de crédito.',
    },
    suppliers: {
      label: 'Proveedores (cuentas por pagar)',
      help: 'Se acredita al ingresar la factura del proveedor y se debita al pagarla.',
    },
    vatSales: { label: 'IVA en ventas (por pagar)', help: 'IVA cobrado en las facturas de venta.' },
    vatPurchases: {
      label: 'IVA en compras (crédito tributario)',
      help: 'IVA pagado en las facturas de proveedores.',
    },
    withheldIncomeReceivable: {
      label: 'Retención de renta que nos hicieron',
      help: 'Retención en la fuente que el cliente nos hace (1 %, 1,75 %, 2 %). Es un crédito a favor.',
    },
    withheldVatReceivable: {
      label: 'Retención de IVA que nos hicieron',
      help: 'IVA retenido por clientes contribuyentes especiales.',
    },
    incomeWithholdingPayable: {
      label: 'Retención de renta por pagar al SRI',
      help: 'Lo que retenemos a los proveedores en renta y se declara cada mes.',
    },
    vatWithholdingPayable: {
      label: 'Retención de IVA por pagar al SRI',
      help: 'Lo que retenemos de IVA a los proveedores.',
    },
    supplierAdvances: {
      label: 'Anticipos a proveedores',
      help: 'Pagos hechos antes de la factura (incluye cheques a empleados para compras).',
    },
    customerAdvances: {
      label: 'Anticipos de clientes',
      help: 'Dinero recibido antes de facturar.',
    },
    postdatedChecks: {
      label: 'Cheques posfechados',
      help: 'Cheques de clientes recibidos y aún no depositados.',
    },
    depositsInTransit: {
      label: 'Depósitos en tránsito',
      help: 'Cheque depositado que el banco todavía no acredita.',
    },
    inventoryAdjustment: {
      label: 'Ajustes de inventario',
      help: 'Contrapartida de ingresos y egresos por ajuste (mermas, toma física).',
    },
    salesDiscounts: { label: 'Descuentos en ventas', help: 'Descuentos dados en factura.' },
    yearResult: {
      label: 'Resultado del ejercicio',
      help: 'Cuenta de patrimonio donde el cierre anual deja la utilidad o pérdida del año.',
    },
    retainedEarnings: {
      label: 'Utilidades acumuladas',
      help: 'A dónde pasa el resultado de años anteriores.',
    },
  } as Record<AccountMapKey, { label: string; help: string }>,
}
