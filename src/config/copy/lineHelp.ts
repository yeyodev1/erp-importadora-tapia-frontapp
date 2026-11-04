/**
 * Ayuda ("?") de las columnas de las grillas de líneas (facturas, compras,
 * notas de crédito, bancos, inventario). Una frase y, si ayuda, un ejemplo.
 */
export const lineHelp = {
  account: 'Cuenta de movimiento del plan de cuentas. Escribe el código (5.2.02.01.01.002) o parte del nombre (flete).',
  expenseAccount: 'Cuenta donde va el gasto o la compra. Ej.: Transporte y fletes, Mantenimiento de vehículos.',
  detail: 'Opcional. Aclara la línea en el mayor. Ej.: flete Guayaquil–Quito.',
  costCenter: 'Opcional, salvo que la cuenta lo exija. Ej.: GYE, UIO, ADMINISTRACION.',
  amount: 'Valor de esta línea en dólares. La línea del banco o caja se arma sola con el total.',
  product: 'Escribe el código o parte del nombre del producto. Ej.: 000002 o achiote.',
  unit: 'Unidad en que se controla el stock (por lo general libras).',
  qty: 'Cantidad en la unidad de control. Ej.: 6613 libras.',
  purchaseQty: 'La misma cantidad expresada en la unidad de compra (sacos, bultos o cajas), según el factor del producto.',
  unitCost: 'Costo por unidad de control. Entra al costo promedio de la bodega.',
  lineTotal: 'Cantidad × precio (o costo) menos el descuento. Se calcula solo.',
  stock: 'Lo que hay ahora en la bodega elegida. Si no alcanza, la factura no se puede grabar.',
  price: 'Precio por unidad, sin IVA. Sale de la lista de precios del cliente; se puede cambiar.',
  discount: 'Descuento en dólares para esta línea, antes del IVA.',
  vatRate: 'Tarifa de IVA del producto (0 % o 15 %). Se define en la ficha del producto.',
  base0: 'Parte de la factura con tarifa 0 % (sin IVA).',
  baseVat: 'Parte de la factura que paga IVA 15 %. El IVA se calcula solo.',
  subtotal: 'Valor de la línea sin IVA.',
  sold: 'Cantidad que se vendió en la factura original.',
  available: 'Lo que todavía se puede devolver de esa línea (lo vendido menos lo ya devuelto).',
  returnQty: 'Cuánto devuelve el cliente. No puede pasar de lo disponible.',
}
