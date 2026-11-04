/**
 * Nombres de iconos de la app → clases de Font Awesome (cargado por CDN en
 * index.html). Los componentes usan el nombre, nunca la clase: cambiar un
 * icono en toda la app es cambiar una línea acá.
 */
export const icons = {
  // Acciones
  x: 'fa-solid fa-xmark',
  plus: 'fa-solid fa-plus',
  minus: 'fa-solid fa-minus',
  check: 'fa-solid fa-check',
  search: 'fa-solid fa-magnifying-glass',
  filter: 'fa-solid fa-filter',
  menu: 'fa-solid fa-bars',
  trash: 'fa-solid fa-trash-can',
  pen: 'fa-solid fa-pen',
  print: 'fa-solid fa-print',
  excel: 'fa-solid fa-file-excel',
  download: 'fa-solid fa-download',
  upload: 'fa-solid fa-upload',
  refresh: 'fa-solid fa-rotate',
  lock: 'fa-solid fa-lock',
  unlock: 'fa-solid fa-lock-open',
  'insert-row': 'fa-solid fa-arrow-turn-up',
  logout: 'fa-solid fa-right-from-bracket',
  key: 'fa-solid fa-key',

  // Navegación
  'chevron-down': 'fa-solid fa-chevron-down',
  'chevron-up': 'fa-solid fa-chevron-up',
  'chevron-left': 'fa-solid fa-chevron-left',
  'chevron-right': 'fa-solid fa-chevron-right',
  'arrow-left': 'fa-solid fa-arrow-left',
  'caret-right': 'fa-solid fa-caret-right',
  'caret-down': 'fa-solid fa-caret-down',

  // Estados
  spinner: 'fa-solid fa-spinner',
  alert: 'fa-solid fa-triangle-exclamation',
  help: 'fa-solid fa-circle-question',
  'check-circle': 'fa-solid fa-circle-check',
  'alert-circle': 'fa-solid fa-circle-exclamation',
  info: 'fa-solid fa-circle-info',
  construction: 'fa-solid fa-person-digging',
  empty: 'fa-regular fa-folder-open',

  // Módulos (mismo orden que la barra lateral)
  home: 'fa-solid fa-house',
  bank: 'fa-solid fa-building-columns',
  ledger: 'fa-solid fa-book',
  payables: 'fa-solid fa-file-invoice-dollar',
  invoice: 'fa-solid fa-receipt',
  receivables: 'fa-solid fa-hand-holding-dollar',
  taxes: 'fa-solid fa-percent',
  inventory: 'fa-solid fa-boxes-stacked',
  settings: 'fa-solid fa-gear',

  // Secciones de cada módulo
  process: 'fa-solid fa-gears',
  report: 'fa-solid fa-chart-column',
  maintenance: 'fa-solid fa-screwdriver-wrench',
  special: 'fa-solid fa-star-of-life',

  // Catálogos
  calendar: 'fa-regular fa-calendar',
  user: 'fa-solid fa-user',
  users: 'fa-solid fa-users',
  warehouse: 'fa-solid fa-warehouse',
  box: 'fa-solid fa-box',
  tags: 'fa-solid fa-tags',
  sitemap: 'fa-solid fa-sitemap',
  building: 'fa-solid fa-building',
  wallet: 'fa-solid fa-wallet',
  scale: 'fa-solid fa-scale-balanced',

  // Avisos, indicadores y acciones principales (mismo icono en toda la app)
  bell: 'fa-solid fa-bell',
  'bell-slash': 'fa-regular fa-bell-slash',
  'check-double': 'fa-solid fa-check-double',
  eye: 'fa-regular fa-eye',
  clock: 'fa-regular fa-clock',
  dot: 'fa-solid fa-circle',
  'trend-up': 'fa-solid fa-arrow-trend-up',
  'trend-down': 'fa-solid fa-arrow-trend-down',
  save: 'fa-solid fa-floppy-disk',
  void: 'fa-solid fa-ban',
  send: 'fa-solid fa-paper-plane',
  // Pantallas (icono por opción del menú: src/layout/screenIcons.ts)
  exchange: 'fa-solid fa-right-left',
  'money-check': 'fa-solid fa-money-check-dollar',
  money: 'fa-solid fa-money-bill-wave',
  'file-lines': 'fa-regular fa-file-lines',
  'file-minus': 'fa-solid fa-file-circle-minus',
  'file-plus': 'fa-solid fa-file-circle-plus',
  'file-import': 'fa-solid fa-file-import',
  'file-contract': 'fa-solid fa-file-contract',
  'chart-line': 'fa-solid fa-chart-line',
  'calendar-check': 'fa-regular fa-calendar-check',
  diagram: 'fa-solid fa-diagram-project',
  clipboard: 'fa-solid fa-clipboard-check',
  layers: 'fa-solid fa-layer-group',
  list: 'fa-solid fa-list',
  truck: 'fa-solid fa-truck',
  trophy: 'fa-solid fa-trophy',
  handshake: 'fa-solid fa-handshake',
} as const

export type IconName = keyof typeof icons
