/** Copy del módulo Cuentas por cobrar (cobros, cheques, retenciones y reportes de cartera). */
const f = (label: string, help: string) => ({ label, help })

export const cxc = {
  methods: {
    DEPOSITO: 'Depósito',
    TRANSFERENCIA: 'Transferencia',
    EFECTIVO: 'Efectivo',
    CHEQUE_POSFECHADO: 'Cheque posfechado',
  } as Record<string, string>,

  receipts: {
    add: 'Nuevo cobro',
    newTitle: 'Nuevo cobro',
    saved: 'Cobro registrado',
    voided: 'Cobro anulado',
    all: 'Todos',
    fields: {
      party: f('Cliente', 'Al elegirlo aparecen sus facturas con saldo pendiente.'),
      date: f(
        'Fecha',
        'Fecha del depósito, transferencia o de recepción del cheque. No puede ser anterior a las facturas.',
      ),
      method: f(
        'Medio',
        'Depósito y transferencia van a un banco; efectivo a una caja; el cheque posfechado queda en cartera hasta depositarlo.',
      ),
      bank: f(
        'Banco / caja',
        'Cuenta donde entró el dinero. Su cuenta contable recibe el débito del asiento.',
      ),
      reference: f(
        'Referencia',
        'Número de papeleta o de transferencia, para conciliar con el banco.',
      ),
      amount: f(
        'Valor',
        'Lo que pagó el cliente. Debe ser igual a la suma aplicada a las facturas.',
      ),
      checkNumber: f('N.º cheque', 'Número impreso en el cheque.'),
      checkBank: f('Banco del cheque', 'Banco que emitió el cheque (el del cliente).'),
      checkDue: f('Fecha de cobro', 'Fecha escrita en el cheque: desde ahí se puede depositar.'),
      notes: f('Observación', 'Aparece en el detalle del cobro.'),
    },
    invoices: 'Facturas con saldo',
    noInvoices: 'Este cliente no tiene facturas con saldo.',
    pickParty: 'Elige el cliente para ver sus facturas.',
    oldest: 'Aplicar a las más antiguas',
    oldestHelp: 'Reparte el valor del cobro empezando por la factura más vieja, hasta agotarlo.',
    applied: 'Aplicado',
    pending: 'Falta aplicar',
    over: 'Aplicado de más',
    mismatch: 'La suma aplicada debe ser igual al valor del cobro',
    voidTitle: 'Anular cobro',
    voidMessage:
      'Se reversa el asiento, el movimiento bancario y el abono: las facturas recuperan su saldo.',
    voidSecond: 'Confírmalo otra vez: el cobro queda anulado.',
    voidLabel: 'Sí, anular',
  },

  checks: {
    intro:
      'Cheques recibidos con fecha futura. Recorrido: en cartera → depositado (depósito en tránsito) → acreditado (banco).',
    active: 'En cartera y depositados',
    deposit: 'Depositar',
    confirm: 'Acreditado',
    return: 'Devuelto',
    depositTitle: 'Depositar cheque',
    depositMessage: 'Asiento: Depósitos en tránsito contra Cheques posfechados.',
    confirmTitle: 'Confirmar acreditación',
    confirmMessage: 'Asiento: Banco contra Depósitos en tránsito, y entra el movimiento al banco.',
    returnTitle: 'Cheque devuelto / protestado',
    returnMessage: 'La deuda vuelve a Clientes y las facturas recuperan su saldo.',
    returnSecond: 'Confírmalo otra vez: el cheque queda devuelto.',
    returnLabel: 'Sí, devolver',
    done: 'Cheque actualizado',
    overdue: 'Ya se puede depositar',
    bank: f('Banco del depósito', 'Cuenta bancaria de la empresa donde se deposita el cheque.'),
    date: f('Fecha', 'Fecha del depósito, de la acreditación o de la devolución.'),
    reason: f(
      'Motivo',
      'Queda en el documento y en su asiento: fondos insuficientes, protesto, error de digitación…',
    ),
  },

  withholdings: {
    add: 'Registrar retención',
    newTitle: 'Retención recibida',
    saved: 'Retención registrada',
    invoice: f(
      'Factura',
      'Factura del cliente sobre la que vino la retención. Solo las que tienen saldo.',
    ),
    date: f('Fecha', 'Fecha de emisión del comprobante de retención.'),
    voucher: f('N.º comprobante', 'Número del comprobante de retención: 001-001-000000123.'),
    authorization: f('Autorización', 'Número de autorización o clave de acceso del SRI.'),
    lines: 'Líneas',
    renta: 'Renta',
    iva: 'IVA',
    rate: f('%', 'Renta: 1, 1,75 o 2 %. IVA: 10, 20, 30, 70 o 100 % (contribuyentes especiales).'),
    base: f(
      'Base',
      'Renta: subtotal sin IVA. IVA: el IVA facturado. Viene sugerida; cámbiala si el comprobante dice otra.',
    ),
    addRenta: 'Línea de renta',
    addIva: 'Línea de IVA',
    total: 'Total retenido',
    overBalance: 'La retención supera el saldo de la factura',
  },

  reports: {
    cutoff: f('Fecha de corte', 'Saldos tal como estaban al final de ese día.'),
    detailed: 'Detallado',
    summary: 'Resumido',
    statusPending: 'Por cobrar',
    statusPaid: 'Canceladas',
    statusAll: 'Todas',
    pickParty: 'Elige un cliente para ver su estado de cuenta.',
    opening: 'Saldo inicial',
    closing: 'Saldo final',
    kinds: {
      FACTURA: 'Factura',
      NOTA_DEBITO: 'Nota de débito',
      NOTA_CREDITO: 'Nota de crédito',
      COBRO: 'Cobro',
      RETENCION: 'Retención',
      CHEQUE_DEVUELTO: 'Cheque devuelto',
      ANULACION: 'Anulación',
    } as Record<string, string>,
  },

  aging: {
    buckets: {
      notDue: 'No vencido',
      d0_30: '0-30',
      d31_60: '31-60',
      d61_90: '61-90',
      d91_120: '91-120',
      over120: '+120',
    },
    cuadra: 'Cuadra',
    descuadra: 'No cuadra',
    summaryTotal: 'Resumida',
    detailTotal: 'Detallada',
    ledgerTotal: 'Libro de cartera',
    checkHelp:
      'Los auditores piden que la resumida (por cliente), la detallada (por factura) y el libro de cartera, que es el mismo que alimenta el mayor de Clientes, den el mismo total al corte.',
    chart: 'Saldo por tramo',
    days: 'Días',
  },

  withholdingsReport: {
    byInvoice: 'Por factura',
    byType: 'Por tipo',
    taxAll: 'Renta e IVA',
  },

  commissions: {
    rate: f(
      '% de comisión',
      'Se aplica sobre lo cobrado en el rango (abonos de cobros vigentes, sin cheques devueltos).',
    ),
    note: 'Regla pendiente de confirmar con Tapia: hoy se calcula sobre el abono completo (con IVA) en la fecha del cobro.',
  },
}
