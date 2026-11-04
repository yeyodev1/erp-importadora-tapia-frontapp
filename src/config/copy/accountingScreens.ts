/**
 * Copy de las pantallas de Contabilidad que no son reportes (comprobantes,
 * detalle, cierre anual, importar plan) y ayudas de columnas que comparten
 * todos los reportes. Lo de los reportes vive en `accounting.ts`.
 */
type Field = { label: string; help: string; placeholder?: string }
const f = (label: string, help: string, placeholder?: string): Field => ({ label, help, placeholder })

export const accountingScreens = {
  /** Ayuda (?) de columnas que se repiten en varios reportes. */
  columns: {
    entryType: 'Tipo de asiento',
    entryTypeHelp: 'Qué documento generó el asiento: diario manual, venta, cobro, compra, pago, banco, inventario, cierre o reverso.',
    party: 'Cliente / proveedor',
    partyHelp: 'Cliente, proveedor o empleado al que se cargó la línea, si la cuenta lo pide.',
    previousHelp: 'Saldo de la cuenta antes de la primera fecha del reporte: lo que venía acumulado.',
    debitHelp: 'Valores cargados a la cuenta. Aumentan activos y gastos; bajan pasivos, patrimonio e ingresos.',
    creditHelp: 'Valores abonados a la cuenta. Aumentan pasivos, patrimonio e ingresos; bajan activos y gastos.',
    balanceHelp: 'Saldo anterior + debe − haber. En el mayor es el saldo corrido después de cada movimiento.',
    costCenterHelp: 'Área o centro de costo al que se carga el gasto, si la cuenta lo controla.',
    amountHelp: 'Total del asiento: la suma del debe (igual a la del haber).',
    statusHelp: 'Contabilizado: vale en los reportes. Anulado: se compensó con su reverso y no suma.',
    sourceHelp: 'Módulo y documento que generaron el asiento. Ej.: Facturación · 001-001-000012190.',
  },

  /** Explicación de cada tipo de asiento (segunda línea del buscador). */
  entryTypeHints: {
    DIARIO: 'Manual de Contabilidad: diario, depreciación, importación o rol de pagos.',
    VENTA: 'Lo genera cada factura de venta.',
    NC_VENTA: 'Nota de crédito a un cliente: devolución o descuento.',
    ND_VENTA: 'Nota de débito a un cliente: cargo adicional.',
    RETENCION_VENTA: 'Retención que nos hizo el cliente (IVA o renta).',
    COBRO: 'Cobro de facturas de clientes.',
    CHEQUE_POSFECHADO: 'Cheque posfechado recibido o depositado.',
    COMPRA: 'Factura de proveedor registrada en Cuentas por Pagar.',
    NC_COMPRA: 'Nota de crédito de un proveedor.',
    PAGO: 'Pago a proveedores con cheque o transferencia.',
    ANTICIPO: 'Anticipo entregado a un proveedor.',
    BANCO: 'Depósito, nota de débito o crédito bancario de Caja Bancos.',
    INVENTARIO: 'Ingreso, egreso o ajuste de bodega.',
    CIERRE: 'Cierre anual: lleva a cero las cuentas 4 y 5.',
    REVERSO: 'Anula otro asiento con los valores al revés.',
  } as Record<string, string>,

  moduleHints: {
    contabilidad: 'Comprobantes manuales y cierre anual.',
    facturacion: 'Facturas, notas de crédito y de débito de venta.',
    cxc: 'Cobros, retenciones recibidas y cheques posfechados.',
    cxp: 'Facturas de proveedores, pagos, anticipos y retenciones emitidas.',
    bancos: 'Depósitos, notas de débito y crédito, transferencias.',
    inventario: 'Ingresos, egresos, ajustes y transferencias de bodega.',
  } as Record<string, string>,

  vouchers: {
    fields: {
      number: f('Número del asiento', 'Número completo o una parte. Ej.: DIA-000123.', 'Ej.: DIA-000123'),
      type: f('Tipo de asiento', 'Filtra por el documento que generó el asiento. Ej.: Venta, Cobro, Diario.'),
      module: f('Módulo de origen', 'Módulo que grabó el asiento. Ej.: Facturación.'),
      account: f('Cuenta contable', 'Asientos que tocan esta cuenta; si es de mayor, también sus hijas. Ej.: 1.1.01.01.02.001 Caja General por Facturación.'),
      q: f('Buscar en el texto', 'Busca en la descripción, el detalle de las líneas y el número del documento. Ej.: arriendo.', 'Ej.: arriendo bodega'),
      amount: f('Valor total', 'Total exacto del asiento (suma del debe). Ej.: 1,250.00.'),
      excludeVoided: f('Ocultar anulados', 'Esconde los asientos anulados y sus reversos, que se compensan entre sí.'),
    },
    empty: 'No hay asientos con estos filtros. Cambia las fechas o usa "Nuevo comprobante" para registrar uno.',
  },

  detail: {
    subtitle: 'Líneas del asiento, quién lo grabó y cuándo, y el documento que lo originó.',
    reason: f('Motivo de anulación', 'Por qué se anula. Queda en el asiento de reverso y en la auditoría.', 'Ej.: Se registró en la cuenta equivocada'),
    empty: 'Este asiento no tiene líneas.',
  },

  yearClose: {
    year: f('Año a cerrar', 'Año que se cierra al 31 de diciembre. Revisa antes su estado de resultados. Ej.: 2025.'),
    reason: f('Motivo de la reapertura', 'Por qué se reabre el año. Queda en el reverso del cierre.', 'Ej.: Falta registrar la depreciación de diciembre'),
    yearHelp: 'Año del cierre.',
    byHelp: 'Usuario que grabó el cierre, con fecha y hora.',
    empty: 'Todavía no hay cierres anuales. Elige el año y usa "Cerrar año" cuando el estado de resultados esté revisado.',
  },

  importChart: {
    line: 'Línea',
    lineHelp: 'Número de línea en el archivo CSV.',
    kind: 'Tipo de cuenta',
    kindHelp: 'Mayor: agrupa otras cuentas y no recibe asientos. Movimiento: la que se usa en los comprobantes.',
    beforeHelp: 'Nombre y tipo que tenía la cuenta antes de importar.',
  },
}
