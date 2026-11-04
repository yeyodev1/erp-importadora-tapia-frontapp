/**
 * Copy de "Nuevo comprobante": explica cada caso en palabras del contador,
 * con un ejemplo de asiento, para que nadie tenga que adivinar qué va dónde.
 */
export interface SubtypeGuide {
  title: string
  icon: string
  when: string
  example: { debit: string; credit: string }
  descriptionPlaceholder: string
}

export const voucherGuide = {
  intro:
    'Aquí van solo los asientos que ningún módulo hace solo. Ventas, compras, cobros, pagos, bancos e inventario ya generan su asiento automáticamente en su pantalla.',
  steps: ['Elige la fecha', 'Elige qué vas a registrar', 'Escribe el concepto', 'Llena las líneas hasta que cuadre'],
  subtypeTitle: '¿Qué vas a registrar?',
  subtypeHelp: 'El tipo no cambia cómo se contabiliza: sirve para encontrarlo después en búsquedas y reportes.',
  exampleLabel: 'Ejemplo típico',
  debitLabel: 'Debe',
  creditLabel: 'Haber',
  subtypes: {
    asiento_diario: {
      title: 'Asiento de diario',
      icon: 'ledger',
      when: 'Correcciones, reclasificaciones, provisiones o cualquier registro que no hace ningún otro módulo.',
      example: { debit: 'Gastos de viaje', credit: 'Caja chica Matriz' },
      descriptionPlaceholder: 'Ej.: Reclasificación de gasto de viaje a Cuenca',
    },
    depreciacion: {
      title: 'Depreciación',
      icon: 'scale',
      when: 'Cada fin de mes: el desgaste de vehículos, equipos, muebles o edificio.',
      example: { debit: 'Gasto depreciación', credit: 'Depreciación acumulada' },
      descriptionPlaceholder: 'Ej.: Depreciación de vehículos de octubre 2026',
    },
    importacion: {
      title: 'Importación',
      icon: 'box',
      when: 'Al liquidar un contenedor: FOB, flete, seguro, aranceles y nacionalización se cargan al inventario de su grupo.',
      example: { debit: 'Inventario Especias', credit: 'Inventario en tránsito' },
      descriptionPlaceholder: 'Ej.: Liquidación importación canela, contenedor 1 de octubre',
    },
    rol_pagos: {
      title: 'Rol de pagos',
      icon: 'users',
      when: 'Al cerrar la nómina del mes: sueldos, horas extra, aportes al IESS y décimos.',
      example: { debit: 'Sueldos y salarios', credit: 'Sueldos por pagar · IESS por pagar' },
      descriptionPlaceholder: 'Ej.: Rol de pagos de octubre 2026',
    },
  } as Record<string, SubtypeGuide>,
  date: {
    label: 'Fecha',
    help: 'Fecha en que se registra en la contabilidad. Por defecto es hoy. Si el mes ya está cerrado no se puede grabar: pide a contabilidad que lo reabra.',
  },
  description: {
    label: 'Concepto',
    help: 'Explica en una frase qué se registra. Aparece en el libro diario, en el mayor y en la búsqueda de comprobantes.',
  },
  columns: {
    account: 'Cuenta de movimiento del plan de cuentas. Escribe el código (1.1.01.02.01.004) o parte del nombre (Pichincha).',
    detail: 'Opcional. Aclara esta línea en el mayor. Ej.: flete del contenedor de canela.',
    debit: 'Aumenta activos y gastos (bancos, inventario, gastos) o disminuye pasivos. Una línea lleva Debe o Haber, nunca los dos.',
    credit: 'Aumenta pasivos, patrimonio e ingresos (proveedores, ventas, depreciación acumulada) o disminuye activos.',
    costCenter: 'Opcional, salvo que la cuenta lo exija (aparece un aviso). Ej.: GYE, UIO, ADMINISTRACION.',
    party: 'Opcional. Cliente, proveedor o empleado de esta línea: así aparece en su estado de cuenta.',
  },
  placeholders: { detail: 'Ej.: flete contenedor', costCenter: 'Ej.: GYE' },
  balance: {
    empty: 'Escribe los valores. Para grabar, el total del Debe tiene que ser igual al total del Haber.',
    missingCredit: 'Falta {amount} en el Haber para que cuadre.',
    missingDebit: 'Falta {amount} en el Debe para que cuadre.',
    ok: 'Cuadra: Debe y Haber suman {amount}.',
    debit: 'Total Debe',
    credit: 'Total Haber',
    difference: 'Diferencia',
  },
}
