import type { Role } from '@/types'

/**
 * Qué hace cada rol, en palabras de la oficina. El detalle módulo por
 * módulo sale de config/access.ts (la misma matriz que usa el sistema), así
 * que nunca puede decir algo distinto de lo que el usuario realmente verá.
 */
export const roleGuide: Record<Role, { summary: string; who: string }> = {
  admin: {
    summary: 'Ve y graba en todo, aprueba pagos, crea usuarios y pasa el SRI a producción.',
    who: 'Gerencia.',
  },
  contabilidad: {
    summary: 'Ve y graba en todos los módulos: asientos, compras, pagos, bancos, impuestos y cierres. No crea usuarios.',
    who: 'El contador y su asistente.',
  },
  facturacion: {
    summary: 'Emite facturas, notas de crédito y débito, guías y proformas. Consulta la cartera y el stock, pero no los modifica.',
    who: 'Quien factura en Guayaquil o en Quito.',
  },
  cartera: {
    summary: 'Registra cobros, cheques posfechados y retenciones de clientes. Consulta las facturas sin modificarlas.',
    who: 'Cobranza (por ejemplo, Majito y Elena).',
  },
  bodega: {
    summary: 'Registra ingresos de importación, transferencias, ajustes por merma y la toma física. No ve valores contables.',
    who: 'Personal de bodega.',
  },
  vendedor: {
    summary: 'Solo ve Inicio. Sus pedidos los hace desde la app de vendedores.',
    who: 'Asesores de venta.',
  },
  auditor: {
    summary: 'Ve y exporta todos los reportes, pero no puede grabar, anular ni cambiar nada.',
    who: 'Auditores externos.',
  },
}

export const accessCopy = {
  title: '¿Qué verá este usuario?',
  compareTitle: 'Qué ve y qué hace cada rol',
  compareHelp: 'Toca un rol para ver el detalle por módulo. "Graba" = puede crear, editar y anular; "Solo ve" = consulta y exporta; "No ve" = el módulo no aparece en su menú.',
  write: 'Graba',
  read: 'Solo ve',
  none: 'No ve',
  usersNote: 'Solo Gerencia ve la pantalla de Usuarios.',
  who: 'Para',
}
