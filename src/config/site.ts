/**
 * El copy es configuración: todos los textos y datos de la empresa viven acá
 * (y en `copy/*.ts`, que se juntan aquí). Los componentes solo consumen y pintan.
 */
import type { IconName } from '@/components/ui/icons'
import type { Role } from '@/types'
import { catalogs } from './copy/catalogs'
import { accountMap } from './copy/accountMap'

export type ModuleKey =
  | 'inicio'
  | 'bancos'
  | 'contabilidad'
  | 'cxp'
  | 'facturacion'
  | 'cxc'
  | 'impuestos'
  | 'inventario'
  | 'configuracion'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export type SectionKey = 'general' | 'procesos' | 'mantenimientos' | 'reportes' | 'especiales'

export const site = {
  name: 'ERP Importadora Tapia',
  shortName: 'Tapia ERP',
  /** Encabezado de todo reporte impreso, igual que el sistema actual. */
  company: {
    legalName: 'IMPORTADORA TAPIA BERZOZA IMCATABE CIA. LTDA.',
    ruc: '0993014214001',
    address: 'PICHINCHA 821 Y SUCRE',
    city: 'GUAYAQUIL',
  },

  /** Barra lateral: mismo orden y nombres que el "SISTEMA INTEGRADO". */
  modules: [
    { key: 'inicio', label: 'Inicio', icon: 'home' },
    { key: 'bancos', label: 'Caja Bancos', icon: 'bank' },
    { key: 'contabilidad', label: 'Contabilidad', icon: 'ledger' },
    { key: 'cxp', label: 'Cuentas por Pagar', icon: 'payables' },
    { key: 'facturacion', label: 'Facturación', icon: 'invoice' },
    { key: 'cxc', label: 'Cuentas por Cobrar', icon: 'receivables' },
    { key: 'impuestos', label: 'Impuestos', icon: 'taxes' },
    { key: 'inventario', label: 'Inventario', icon: 'inventory' },
    { key: 'configuracion', label: 'Configuración', icon: 'settings' },
  ] as { key: ModuleKey; label: string; icon: IconName }[],

  /** Submenús de cada módulo, en el orden de la barra de menú del sistema viejo. */
  sections: {
    general: 'General',
    procesos: 'Procesos',
    mantenimientos: 'Mantenimientos',
    reportes: 'Reportes',
    especiales: 'Procesos especiales',
  } as Record<SectionKey, string>,

  roles: {
    admin: 'Gerencia',
    contabilidad: 'Contabilidad',
    facturacion: 'Facturación',
    cartera: 'Cartera',
    bodega: 'Bodega',
    vendedor: 'Vendedor',
    auditor: 'Auditor (solo lectura)',
  } as Record<Role, string>,

  login: {
    eyebrow: 'Sistema integrado',
    title: 'Ingresar',
    email: 'Correo',
    emailPlaceholder: 'Ej.: contabilidad@importadoratapia.app',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    submit: 'Ingresar',
    loading: 'Ingresando…',
    welcome: 'Hola,',
  },

  topbar: {
    warehouse: 'Bodega',
    noWarehouse: 'Sin bodega',
    logout: 'Cerrar sesión',
    loggedOut: 'Sesión cerrada',
    menu: 'Abrir menú',
    readOnly: 'Solo lectura',
  },

  access: {
    denied: 'No tienes permiso para esa pantalla',
  },

  table: {
    export: 'Excel',
    print: 'Imprimir / PDF',
    totals: 'Totales',
    records: 'registros',
    page: 'Página',
    of: 'de',
    prev: 'Anterior',
    next: 'Siguiente',
    emptyTitle: 'Sin resultados',
    emptyMessage: 'No hay datos con estos filtros. Cambia las fechas o la búsqueda y vuelve a consultar.',
    errorTitle: 'No se pudo cargar',
    retry: 'Reintentar',
    search: 'Buscar…',
    exporting: 'Preparando el archivo…',
  },

  print: {
    user: 'Usuario',
    date: 'Fecha',
    filters: 'Filtros',
  },

  filters: {
    from: 'Desde',
    to: 'Hasta',
    warehouse: 'Bodega',
    party: 'Cliente / proveedor',
    partyBy: { customer: 'Cliente', supplier: 'Proveedor', employee: 'Empleado' },
    product: 'Producto',
    account: 'Cuenta contable',
    bankAccount: 'Banco / caja',
    apply: 'Consultar',
    all: 'Todas',
    /** Ayuda (?) de cada filtro de reporte. */
    help: {
      from: 'Primer día que entra en el reporte. Abre en el primero del mes. Ej.: 01/11/2026.',
      to: 'Último día que entra en el reporte (incluido). Abre en hoy.',
      warehouse: 'Solo los movimientos de esa bodega. "Todas" suma Guayaquil, Quito y las demás.',
      bankAccount: 'Solo la cuenta de banco o caja elegida. "Todas" las muestra juntas.',
      party: 'Filtra por un cliente o proveedor. Escribe su nombre o RUC. Ej.: 0993014214001.',
      product: 'Filtra por un producto. Escribe el código o el nombre. Ej.: 000010 Canela superior.',
      account: 'Filtra por una cuenta contable de movimiento. Ej.: 1.1.01.01.02.001 Caja General por Facturación.',
    },
  },

  pickers: {
    searchParty: 'Nombre, RUC o cédula',
    searchProduct: 'Código o nombre',
    searchAccount: 'Código o nombre de la cuenta',
    typeToSearch: 'Escribe para buscar',
    noResults: 'Sin resultados',
    clear: 'Quitar',
    notFoundId: 'No hay un tercero con esa identificación',
  },

  lines: {
    add: 'Agregar línea',
    insert: 'Insertar línea arriba',
    remove: 'Eliminar línea',
    empty: 'Sin líneas. Agrega la primera.',
  },

  entry: {
    title: 'Asiento contable',
    account: 'Cuenta',
    detail: 'Detalle',
    debit: 'Debe',
    credit: 'Haber',
    balanced: 'Cuadra',
    unbalanced: 'Descuadre',
    empty: 'El asiento aparece cuando el documento tenga valores.',
  },

  confirm: {
    cancel: 'Cancelar',
    continue: 'Continuar',
    sure: '¿Seguro?',
    steps: ['Revisar', 'Confirmar'],
    deactivateTitle: 'Desactivar registro',
    deactivateMessage: 'Deja de aparecer en búsquedas y documentos nuevos. Lo ya grabado no cambia.',
    deactivateSecond: 'Confírmalo otra vez para desactivarlo.',
    deactivateLabel: 'Sí, desactivar',
  },

  common: {
    save: 'Guardar',
    saved: 'Cambios guardados',
    created: 'Registro creado',
    cancel: 'Cancelar',
    edit: 'Editar',
    new: 'Nuevo',
    active: 'Activo',
    inactive: 'Inactivo',
    showInactive: 'Ver inactivos',
    yes: 'Sí',
    no: 'No',
    help: 'Ayuda',
    pickDate: 'Elegir fecha',
  },

  /**
   * Estados de documentos → etiqueta y color del <StatusBadge>. Claves tal
   * como las guarda el API (SriStatus, estado del documento, del cheque).
   */
  status: {
    // SRI
    autorizado: { label: 'Autorizado SRI', tone: 'success', icon: 'check-circle' },
    sin_firma: { label: 'Sin firma', tone: 'warning', icon: 'key' },
    firmado: { label: 'Firmado', tone: 'info', icon: 'pen' },
    recibido: { label: 'Recibido SRI', tone: 'info', icon: 'clock' },
    devuelto: { label: 'Devuelto', tone: 'danger', icon: 'alert-circle' },
    no_autorizado: { label: 'No autorizado', tone: 'danger', icon: 'void' },
    error: { label: 'Error SRI', tone: 'danger', icon: 'alert' },
    // Documento (anulado: gris y tachado, como la fila)
    vigente: { label: 'Vigente', tone: 'success', icon: 'check' },
    contabilizado: { label: 'Contabilizado', tone: 'info', icon: 'ledger' },
    anulado: { label: 'Anulado', tone: 'neutral', icon: 'void' },
    anulada: { label: 'Anulada', tone: 'neutral', icon: 'void' },
    // Pagos, aprobaciones, proformas
    pendiente: { label: 'Pendiente', tone: 'warning', icon: 'clock' },
    aprobado: { label: 'Aprobado', tone: 'info', icon: 'check' },
    aprobada: { label: 'Aprobada', tone: 'info', icon: 'check' },
    pagado: { label: 'Pagado', tone: 'success', icon: 'check-circle' },
    pagada: { label: 'Pagada', tone: 'success', icon: 'check-circle' },
    facturada: { label: 'Facturada', tone: 'success', icon: 'invoice' },
    // Conciliación / períodos
    abierta: { label: 'Abierta', tone: 'warning', icon: 'unlock' },
    cerrada: { label: 'Cerrada', tone: 'neutral', icon: 'lock' },
    // Cheques
    en_cartera: { label: 'En cartera', tone: 'warning', icon: 'wallet' },
    depositado: { label: 'Depositado', tone: 'info', icon: 'bank' },
    acreditado: { label: 'Acreditado', tone: 'success', icon: 'check-circle' },
    // Catálogos
    activo: { label: 'Activo', tone: 'success', icon: 'dot' },
    inactivo: { label: 'Inactivo', tone: 'neutral', icon: 'dot' },
    // Migración de datos
    aplicado: { label: 'Aplicado', tone: 'success', icon: 'check-circle' },
    quitado: { label: 'Quitado', tone: 'neutral', icon: 'void' },
    nuevo: { label: 'Nuevo', tone: 'info', icon: 'plus' },
    existente: { label: 'Ya existe', tone: 'neutral', icon: 'check' },
    conflicto: { label: 'Conflicto', tone: 'danger', icon: 'alert-circle' },
    se_quita: { label: 'Se quita', tone: 'warning', icon: 'trash' },
    en_uso: { label: 'En uso', tone: 'info', icon: 'lock' },
  } as Record<string, { label: string; tone: BadgeTone; icon?: IconName }>,

  underConstruction: {
    title: 'En construcción',
    message: 'Esta pantalla llega en una próxima entrega. El menú ya queda en su lugar.',
  },

  notFound: {
    code: '404',
    title: 'Esta página no existe',
    message: 'Puede que el enlace esté mal escrito o que la página se haya movido.',
    back: 'Volver al inicio',
  },

  catalogs,
  accountMap,
}
