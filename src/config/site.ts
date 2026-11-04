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
    autorizado: { label: 'Autorizado SRI', tone: 'success' },
    sin_firma: { label: 'Sin firma', tone: 'warning' },
    firmado: { label: 'Firmado', tone: 'info' },
    recibido: { label: 'Recibido SRI', tone: 'info' },
    devuelto: { label: 'Devuelto', tone: 'danger' },
    no_autorizado: { label: 'No autorizado', tone: 'danger' },
    error: { label: 'Error SRI', tone: 'danger' },
    vigente: { label: 'Vigente', tone: 'neutral' },
    contabilizado: { label: 'Contabilizado', tone: 'info' },
    anulado: { label: 'Anulado', tone: 'danger' },
    anulada: { label: 'Anulada', tone: 'danger' },
    pendiente: { label: 'Pendiente', tone: 'warning' },
    pagada: { label: 'Pagada', tone: 'success' },
    abierta: { label: 'Abierta', tone: 'warning' },
    cerrada: { label: 'Cerrada', tone: 'neutral' },
    facturada: { label: 'Facturada', tone: 'success' },
    en_cartera: { label: 'En cartera', tone: 'warning' },
    depositado: { label: 'Depositado', tone: 'info' },
    acreditado: { label: 'Acreditado', tone: 'success' },
    activo: { label: 'Activo', tone: 'success' },
    inactivo: { label: 'Inactivo', tone: 'neutral' },
  } as Record<string, { label: string; tone: BadgeTone }>,

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
