/**
 * Copy de Configuración › Migración de datos: cargar Macio y la app de
 * Proveedores, quitar los datos de ejemplo y deshacer una importación.
 */
type Field = { label: string; help: string }
const f = (label: string, help: string): Field => ({ label, help })

export const migration = {
  intro:
    'Carga los datos reales del sistema anterior. Primero se ve una vista previa (no graba nada); al importar todo queda en un lote que se puede quitar completo desde el historial.',

  macio: {
    title: 'Datos de Macio',
    help: 'El archivo .json exportado de las 4 vistas de Macio: clientes, vendedores, inventario y cartera.',
    file: f('Archivo de Macio (.json)', 'El JSON que exportó el técnico desde Macio. Se lee en tu navegador y solo se envía al pedir la vista previa.'),
    pick: 'Elegir archivo',
    noFile: 'Ningún archivo elegido',
    badFile: 'El archivo no es un JSON válido',
    preview: 'Vista previa',
    apply: 'Importar',
    applyTitle: 'Importar datos de Macio',
    applyMessage: 'Se crean {clients} clientes, {products} productos, {stock} saldos de stock y {invoices} saldos iniciales de cartera por {total}, con un asiento resumen.',
    applySecond: 'Queda todo en un lote del historial: si algo sale mal se puede quitar completo mientras nadie lo use. ¿Importar ahora?',
    applied: 'Datos de Macio importados',
    verified: 'Verificación: cartera por edades {aging} · {agingOk} · balance de comprobación {trialOk}',
    ok: 'cuadra',
    notOk: 'NO cuadra',
  },

  stats: {
    clients: 'Clientes en el archivo',
    newClients: 'Clientes nuevos',
    existingClients: 'Ya existen',
    invalidIds: 'Identificación a revisar',
    sellers: 'Vendedores',
    products: 'Productos',
    stockLines: 'Saldos de stock',
    invoices: 'Facturas abiertas',
    receivables: 'Saldo de cartera',
    unmatched: 'Sin cliente',
    creditNotes: 'NC excluidas',
  },

  tabs: {
    products: 'Productos',
    invoices: 'Cartera',
    sellers: 'Vendedores',
    invalid: 'Identificaciones',
    unmatched: 'Sin cliente',
  },

  cols: {
    code: f('Código', 'Código del ERP: el de Macio con ceros a la izquierda (6 dígitos).'),
    name: f('Nombre', 'Como viene de Macio, en mayúsculas.'),
    unit: f('Unidad', 'Unidad de control. La de compra queda igual con factor 1 (factor pendiente).'),
    group: f('Grupo sugerido', 'Elegido por palabras del nombre (almendra, lenteja…). Revísalo en la ficha del producto.'),
    status: f('Estado', 'Nuevo: se crea. Existente: ya está en el ERP con ese código y nombre. Conflicto: el código existe con otro nombre.'),
    gye: f('Stock GYE', 'Cantidad en Bodega Guayaquil (Macio bodega 12). Entra a costo $0.'),
    uio: f('Stock UIO', 'Cantidad en Bodega Quito (Macio bodega 13). Entra a costo $0.'),
    number: f('Factura', 'Serie y número originales de Macio (102999 Guayaquil, 301999 Quito).'),
    customer: f('Cliente', 'Unido por nombre: la cartera de Macio no trae RUC.'),
    date: f('Fecha', 'Fecha original de la factura.'),
    dueDate: f('Vence', 'Vencimiento original: define el tramo en la cartera por edades.'),
    total: f('Total', 'Total original de la factura.'),
    paid: f('Abonado', 'Lo que ya se cobró en Macio.'),
    balance: f('Saldo', 'Lo que se carga como saldo inicial por cobrar.'),
    identification: f('Identificación', 'RUC, cédula o lo que traiga Macio.'),
    idType: f('Tipo', 'Cómo se guarda: 13 dígitos RUC, 10 cédula, otro pasaporte.'),
    problem: f('Motivo', 'Por qué conviene revisarla. El cliente se importa igual.'),
    customers: f('Clientes', 'Clientes que Macio le asigna.'),
  },

  suppliers: {
    title: 'App de Proveedores',
    help: 'Proveedores y fotos de productos de la app de Proveedores (misma base de datos). Esa app no guarda RUC: sin RUC no se importa.',
    preview: 'Vista previa',
    apply: 'Importar',
    applyTitle: 'Importar desde la app de Proveedores',
    applyMessage: 'Se crean {suppliers} proveedores, se marcan {marked} terceros como proveedor y se ponen {photos} fotos en productos.',
    applySecond: 'Queda en un lote del historial y se puede quitar. ¿Importar ahora?',
    applied: 'Datos de la app de Proveedores importados',
    withoutRuc: 'Sin RUC, no importados',
    photos: 'Fotos a poner',
    photosSkipped: 'Fotos que no se ponen',
    toImport: 'Proveedores a importar',
  },

  demo: {
    title: 'Datos de ejemplo',
    help: 'Terceros con "EJEMPLO" en el nombre y los 6 productos de prueba del arranque. Solo se quita lo que ningún documento usa.',
    preview: 'Vista previa',
    apply: 'Quitar datos de ejemplo',
    applyMessage: 'Se borran {remove} registros de ejemplo que nadie usa. Los que tienen documentos se quedan.',
    applySecond: 'No se puede deshacer. ¿Quitar los datos de ejemplo?',
    applied: 'Datos de ejemplo quitados',
    empty: 'No quedan datos de ejemplo.',
    usedBy: f('Lo usa', 'Documentos que usan este registro: por eso no se borra.'),
  },

  history: {
    title: 'Historial de importaciones',
    help: 'Cada importación es un lote. "Quitar datos importados" deshace el lote completo: reversa el asiento, saca el stock y borra lo que creó.',
    empty: 'Aún no hay importaciones.',
    undo: 'Quitar datos importados',
    undoMessage: 'Se reversa el asiento, se saca el stock que entró y se borran los saldos iniciales, productos y terceros que creó este lote. Lo que ya existía antes no se toca.',
    undoSecond: 'Si después de importar alguien registró un cobro, factura o movimiento con estos datos, no se quita y verás qué lo impide. ¿Quitar ahora?',
    undone: 'Importación quitada',
    reason: { label: 'Motivo', help: 'Queda en el historial y en el asiento de reverso. Ej.: archivo de Macio incompleto.', placeholder: 'Ej.: se vuelve a exportar Macio' },
    cols: {
      number: f('Lote', 'Número del lote de importación.'),
      date: f('Fecha', 'Cuándo se importó.'),
      source: f('Origen', 'Macio o la app de Proveedores.'),
      user: f('Quién', 'Usuario que importó.'),
      counts: f('Qué trajo', 'Registros creados por el lote.'),
      total: f('Cartera', 'Saldo inicial de cartera cargado.'),
      status: f('Estado', 'Aplicado: está en el sistema. Quitado: se deshizo.'),
    },
    sources: { macio: 'Macio', proveedores: 'App de Proveedores' } as Record<string, string>,
  },

  noticesTitle: 'Antes de importar',
  blockersTitle: 'No se puede importar todavía',
  warningsTitle: 'Avisos del archivo',
}
