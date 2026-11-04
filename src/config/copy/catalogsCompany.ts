/**
 * Copy de los catálogos de empresa (grupos, bodegas, bancos, usuarios, empresa,
 * cierre de meses). Se junta en `catalogs` (copy/catalogs.ts): mismo acceso
 * `site.catalogs.<x>`.
 */
type Field = { label: string; help: string }
const f = (label: string, help: string): Field => ({ label, help })

export const catalogsCompany = {
  groups: {
    title: 'Grupos de producto',
    subtitle: 'Cada grupo dice a qué cuentas van el inventario, las ventas y el costo de venta de sus productos.',
    empty: 'Aún no hay grupos. Usa "Nuevo grupo" para crear uno (ej.: ESPECIAS).',
    add: 'Nuevo grupo',
    newTitle: 'Nuevo grupo',
    editTitle: 'Editar grupo',
    addSubgroup: 'Agregar',
    cols: {
      inventory: f('Cuenta de inventario', 'Se debita al ingresar mercadería y se acredita al vender.'),
      sales: f('Cuenta de ventas', 'Recibe la base de cada factura de venta.'),
      cost: f('Cuenta de costo', 'Recibe el costo promedio de lo vendido.'),
      status: f('Estado', 'Activo: se puede elegir en productos nuevos.'),
    },
    fields: {
      name: f('Nombre', 'Cómo se agrupan los productos en reportes y estados. Ej.: ESPECIAS, FRUTOS SECOS, GRANOS Y SEMILLAS.'),
      subgroups: f('Subgrupos', 'Opcional. Escribe uno y presiona Agregar. Ej.: Materia prima.'),
      inventory: f('Cuenta de inventario', 'Se debita al ingresar mercadería y se acredita al vender. Ej.: 1.1.03.01.01.001 Inventario Especias.'),
      sales: f('Cuenta de ventas', 'Se acredita con la base de cada factura: el estado de resultados sale por grupo. Ej.: 4.1.01.01.01.001.'),
      cost: f('Cuenta de costo de venta', 'Se debita al costo promedio en cada venta. Ej.: 5.1.01.01.01.001 Costo de Venta Especias.'),
      isActive: f('Activo', 'Un grupo inactivo no se ofrece al crear productos.'),
    },
    ph: { name: 'Ej.: ESPECIAS', subgroup: 'Ej.: Materia prima' },
  },

  warehouses: {
    title: 'Bodegas',
    subtitle: 'Bodegas de Tapia con su serie del SRI: cada una factura con su establecimiento y punto de emisión.',
    empty: 'Aún no hay bodegas. Usa "Nueva bodega" para crear una.',
    add: 'Nueva bodega',
    newTitle: 'Nueva bodega',
    editTitle: 'Editar bodega',
    adminOnly: 'Solo gerencia crea o cambia bodegas.',
    cols: {
      serie: f('Serie SRI', 'Establecimiento y punto de emisión: el inicio del número de factura. Ej.: 001-001.'),
      status: f('Estado', 'Activa: se puede elegir en documentos. Inactiva: queda oculta.'),
    },
    fields: {
      code: f('Código', 'Corto y en mayúsculas. Ej.: GYE, UIO.'),
      name: f('Nombre', 'Como se verá al elegirla. Ej.: Bodega Guayaquil.'),
      establishment: f('Establecimiento SRI', 'Tres dígitos. Con el punto de emisión arma la serie de las facturas. Ej.: 001.'),
      emissionPoint: f('Punto de emisión', 'Tres dígitos que siguen al establecimiento en la factura. Ej.: 001 (factura 001-001-000012190).'),
      address: f('Dirección', 'Dirección del establecimiento en la factura. Ej.: Pichincha 821 y Sucre.'),
      isActive: f('Activa', 'Una bodega inactiva no se puede elegir en documentos nuevos.'),
    },
    ph: { code: 'Ej.: GYE', name: 'Ej.: Bodega Guayaquil', establishment: '001', emissionPoint: '001', address: 'Ej.: Pichincha 821 y Sucre' },
  },

  banks: {
    title: 'Bancos y cajas',
    subtitle: 'Cuentas de banco y cajas de efectivo de Tapia, cada una ligada a su cuenta contable.',
    empty: 'Aún no hay bancos ni cajas. Usa "Nueva cuenta" para registrar uno.',
    add: 'Nueva cuenta',
    newTitle: 'Nueva cuenta bancaria o caja',
    editTitle: 'Editar cuenta bancaria o caja',
    kinds: { banco: 'Banco', caja: 'Caja' },
    kindTabs: { all: 'Todas', banco: 'Bancos', caja: 'Cajas' },
    kindHelp: {
      all: 'Bancos y cajas juntos.',
      banco: 'Cuenta en un banco: emite cheques, recibe depósitos y se concilia con el estado de cuenta.',
      caja: 'Efectivo en la oficina (caja chica, caja de compras varias): no emite cheques ni se concilia.',
    },
    types: { corriente: 'Corriente', ahorros: 'Ahorros' },
    typeHelp: {
      corriente: 'Cuenta corriente: la que emite cheques.',
      ahorros: 'Cuenta de ahorros: transferencias y depósitos, sin chequera.',
    },
    cols: {
      number: f('Número de cuenta', 'Tipo y número de la cuenta en el banco.'),
      nextCheck: f('Próximo cheque', 'Número que tomará el siguiente cheque emitido desde esta cuenta.'),
      status: f('Estado', 'Activa: se puede usar en cobros y pagos. Inactiva: queda oculta.'),
    },
    fields: {
      kind: f('Banco o caja', 'Banco emite cheques y se concilia; caja es efectivo (caja chica, compras varias).'),
      name: f('Nombre', 'Como se verá al elegirla. Ej.: Banco Pichincha Cte.'),
      bank: f('Banco', 'Nombre del banco. Ej.: Banco Pichincha.'),
      number: f('Número de cuenta', 'Como sale en el estado de cuenta. Ej.: 2100123456.'),
      type: f('Tipo de cuenta', 'Corriente (con chequera) o ahorros.'),
      accountCode: f('Cuenta contable', 'Cuenta de movimiento que se mueve con cada depósito o cheque. Ej.: 1.1.01.02.01.004 Banco Pichincha.'),
      nextCheck: f('Próximo cheque', 'Número que tomará el siguiente cheque emitido. Ej.: 1520.'),
      isActive: f('Activa', 'Una cuenta inactiva no aparece en cobros ni pagos nuevos.'),
    },
    ph: { name: 'Ej.: Banco Pichincha Cte.', bank: 'Ej.: Banco Pichincha', number: 'Ej.: 2100123456', nextCheck: 'Ej.: 1520' },
  },

  users: {
    title: 'Usuarios',
    add: 'Nuevo usuario',
    newTitle: 'Nuevo usuario',
    editTitle: 'Editar usuario',
    never: 'Nunca',
    fields: {
      name: f('Nombre', 'Sale en el pie de los reportes que imprime.'),
      email: f('Correo', 'Con este correo ingresa. No se cambia después.'),
      password: f('Contraseña inicial', 'Mínimo 8 caracteres. La persona la cambia después.'),
      phone: f('Teléfono', 'Opcional. Celular de contacto del usuario, por si hay que avisarle algo. Ej.: 0991234567.'),
      role: f('Rol', 'Define qué módulos ve y en cuáles puede grabar. Abajo se muestra el detalle módulo por módulo del rol elegido.'),
      warehouseId: f('Bodega', 'Bodega por defecto al facturar y en inventario.'),
      isActive: f('Activo', 'Un usuario inactivo no puede ingresar.'),
      lastLoginAt: f('Último ingreso', ''),
    },
  },

  company: {
    title: 'Empresa',
    subtitle: 'Datos de Tapia que salen en cada comprobante electrónico y en el encabezado de los reportes.',
    sriTitle: 'Facturación electrónica',
    sriTest: 'Pruebas',
    sriProd: 'Producción',
    sriHelp: {
      1: 'El SRI recibe los comprobantes solo para probar: no tienen validez tributaria. Úsalo mientras se revisa todo.',
      2: 'Cada factura, nota de crédito y retención vale ante el SRI. Úsalo para el trabajo real.',
    },
    prodConfirm: 'Pasar a producción',
    prodMessage: 'Desde ahora cada factura, nota de crédito y retención se envía al SRI de verdad.',
    prodSecond: 'Confírmalo otra vez: los comprobantes emitidos en producción tienen validez tributaria.',
    fields: {
      ruc: f('RUC', 'RUC de la empresa, 13 dígitos. Ej.: 0993014214001.'),
      legalName: f('Razón social', 'Encabeza todos los reportes y comprobantes. Ej.: IMPORTADORA TAPIA BERZOZA IMCATABE CIA. LTDA.'),
      tradeName: f('Nombre comercial', 'Opcional. El nombre conocido del negocio. Ej.: Importadora Tapia.'),
      address: f('Dirección matriz', 'Dirección del RUC que va en cada comprobante. Ej.: Pichincha 821 y Sucre, Guayaquil.'),
      keepsAccounting: f('Obligado a llevar contabilidad', 'Va en el XML de cada comprobante electrónico.'),
      specialTaxpayer: f('Contribuyente especial (resolución)', 'Número de resolución; vacío si no lo es. Ej.: 12345.'),
      sriEnvironment: f('Ambiente SRI', 'Pruebas no tiene validez tributaria. Pasa a producción solo cuando todo esté revisado.'),
    },
    ph: {
      ruc: 'Ej.: 0993014214001',
      legalName: 'Ej.: IMPORTADORA TAPIA BERZOZA IMCATABE CIA. LTDA.',
      tradeName: 'Ej.: Importadora Tapia',
      address: 'Ej.: Pichincha 821 y Sucre',
      specialTaxpayer: 'Ej.: 12345 (vacío si no es)',
    },
  },

  periodLock: {
    title: 'Cierre de meses',
    intro: 'Un mes cerrado no acepta documentos con fecha en o antes de él. Se cierra después de declarar.',
    current: 'Cerrado hasta',
    none: 'Ningún mes cerrado',
    closedHint: 'Cerrado',
    openHint: 'Abierto',
    month: f('Mes', 'Se cierran todos los meses hasta este, inclusive. Abre en el mes pasado, el que normalmente se acaba de declarar.'),
    close: 'Cerrar hasta este mes',
    reopen: 'Reabrir desde este mes',
    reopenAll: 'Reabrir todo',
    closeTitle: 'Cerrar meses',
    closeMessage: 'Nadie podrá grabar ni anular documentos con fecha hasta fin de',
    closeSecond: 'Confírmalo otra vez. Se puede reabrir, pero queda registrado.',
    reopenTitle: 'Reabrir meses',
    reopenMessage: 'Se podrán grabar documentos desde',
    reopenSecond: 'Confírmalo otra vez: un mes reabierto puede cambiar lo ya declarado.',
    closed: 'Meses cerrados',
    reopened: 'Meses reabiertos',
  },
}
