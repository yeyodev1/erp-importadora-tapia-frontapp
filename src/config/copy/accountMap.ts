import type { AccountMapKey } from '@/types'
import { accountMapPayroll } from './accountMapPayroll'

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
    ...accountMapPayroll.groups,
  ] as { title: string; keys: AccountMapKey[] }[],
  keys: {
    customers: {
      label: 'Clientes (cuentas por cobrar)',
      help: 'Se debita al facturar y se acredita al cobrar o aplicar una nota de crédito. Ej.: 1.1.02.01.01.001 Clientes.',
    },
    suppliers: {
      label: 'Proveedores (cuentas por pagar)',
      help: 'Se acredita al ingresar la factura del proveedor y se debita al pagarla. Ej.: 2.1.01.01.01.001 Proveedores de Bienes y Servicios.',
    },
    vatSales: { label: 'IVA en ventas (por pagar)', help: 'IVA cobrado en las facturas de venta. Ej.: 2.1.02.01.01.001 IVA Cobrado en Ventas.' },
    vatPurchases: {
      label: 'IVA en compras (crédito tributario)',
      help: 'IVA pagado en las facturas de proveedores. Ej.: 1.1.04.01.01.001 IVA Pagado en Compras.',
    },
    withheldIncomeReceivable: {
      label: 'Retención de renta que nos hicieron',
      help: 'Retención en la fuente que el cliente nos hace (1 %, 1,75 %, 2 %). Es un crédito a favor. Ej.: 1.1.04.01.02.001 Retenciones en la Fuente Recibidas.',
    },
    withheldVatReceivable: {
      label: 'Retención de IVA que nos hicieron',
      help: 'IVA retenido por clientes contribuyentes especiales. Ej.: 1.1.04.01.01.002 IVA Retenido por Clientes.',
    },
    incomeWithholdingPayable: {
      label: 'Retención de renta por pagar al SRI',
      help: 'Lo que retenemos a los proveedores en renta y se declara cada mes. Ej.: 2.1.02.02.01.001 Agente de Retención IR.',
    },
    vatWithholdingPayable: {
      label: 'Retención de IVA por pagar al SRI',
      help: 'Lo que retenemos de IVA a los proveedores. Ej.: 2.1.02.02.01.002 Agente de Retención IVA.',
    },
    supplierAdvances: {
      label: 'Anticipos a proveedores',
      help: 'Pagos hechos antes de la factura (incluye cheques a empleados para compras). Ej.: 1.1.02.02.01.001 Anticipos a Proveedores.',
    },
    customerAdvances: {
      label: 'Anticipos de clientes',
      help: 'Dinero que el cliente paga antes de que se le facture. Ej.: 2.1.01.02.01.001 Anticipos de Clientes.',
    },
    postdatedChecks: {
      label: 'Cheques posfechados',
      help: 'Cheques de clientes recibidos y aún no depositados. Ej.: 1.1.01.01.02.003 Caja cheques postfechados.',
    },
    depositsInTransit: {
      label: 'Depósitos en tránsito',
      help: 'Cheque depositado que el banco todavía no acredita. Ej.: 1.1.01.01.02.005 Depósito en Tránsito.',
    },
    inventoryAdjustment: {
      label: 'Ajustes de inventario',
      help: 'Contrapartida de ingresos y egresos por ajuste (mermas, toma física). Ej.: 5.2.02.01.01.005 Mermas de Inventario.',
    },
    salesDiscounts: { label: 'Descuentos en ventas', help: 'Descuentos dados en la factura de venta. Ej.: 4.1.01.01.02.001 Descuentos en Ventas.' },
    yearResult: {
      label: 'Resultado del ejercicio',
      help: 'Cuenta de patrimonio donde el cierre anual deja la utilidad o pérdida del año. Ej.: 3.1.01.01.01.002 Utilidad o Pérdida del Ejercicio.',
    },
    retainedEarnings: {
      label: 'Utilidades acumuladas',
      help: 'A dónde pasa la utilidad o pérdida de años anteriores. Ej.: 3.1.01.01.01.001 Utilidades Acumuladas.',
    },
    ...accountMapPayroll.keys,
  } as Record<AccountMapKey, { label: string; help: string }>,
}
