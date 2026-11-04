# Componentes compartidos

Piezas para construir las pantallas de los módulos. **Montos siempre en CENTAVOS enteros**
(como el API); cantidades con 4 decimales; fechas `AAAA-MM-DD`. El copy va en `src/config/site.ts`.

## ui/

| Componente | Para qué | Props clave |
|---|---|---|
| `PageHeader` | Título de pantalla (por defecto el de la ruta), migas módulo · submenú, badge "Solo lectura". Slot = acciones. | `title?`, `subtitle?` |
| `FormField` | Etiqueta + ayuda (?) + control + error. | `label`, `help?`, `for?`, `required?`, `error?`, `hint?`, `full?` |
| `HelpTip` | "?" con texto al pasar el mouse, enfocar o tocar. | `text`, `label?` |
| `MoneyInput` | Escribe dólares ("1.234,56" o "1234.56"), **v-model en centavos** (`number \| null`). | `id?`, `allowNegative?`, `disabled?`, `invalid?` |
| `QtyInput` | Cantidad con 4 decimales; `unit` al final. | `id?`, `unit?`, `allowNegative?` |
| `BaseCombobox` | Selector con búsqueda local (reemplaza `<select>`). | `id`, `options: ComboOption[]`, `emptyLabel?`, `onCreate?` |
| `BaseDatePicker` | Fecha `AAAA-MM-DD` (reemplaza `type=date`). | `id`, `rangeStart?`, `rangeEnd?`, `clearable?`, `placeholder?` (vacío: "Elegir fecha"). Nunca abrir vacío: hoy en documentos, `monthStart()` → hoy en reportes |
| `BaseSwitch` | Interruptor (reemplaza checkbox). | `label`, `hint?`, `help?`, `disabled?` |
| `BaseSegmented` | Pocas opciones visibles / pestañas. | `options: {value,label,count?,help?}[]`, `tabs?`. `help`: qué significa el caso (se ve al pasar el mouse y, el elegido, debajo) |
| `BaseBadge` / `StatusBadge` | Etiqueta de color / estado con **icono + color** (mapa `site.status`: SRI `autorizado` ✓ verde, `sin_firma` ámbar, `devuelto`/`no_autorizado`/`error` rojo, `recibido` azul; `vigente`, `anulado` gris tachado; cheques `en_cartera`/`depositado`/`acreditado`/`devuelto`; `abierta`/`cerrada`; `pendiente`/`aprobado`/`pagado`; `activo`/`inactivo`). Estado nuevo = una línea en `site.status`. | `tone` / `status` |
| `AlertBanner` | Aviso dentro de una pantalla: nivel `info\|warning\|danger\|success` con su icono y color, acción opcional y cerrable. El de "PRUEBAS del SRI" ya lo pinta el layout en Facturación y Configuración. | `level`, `title`, `message` (o slot), `icon?`, `actionLabel?` + `to?` (enlace) o `@action`, `closable?`, `dismissKey?` (recuerda el cierre en la sesión) |
| `LockedDateBanner` | "Este mes está cerrado" si la fecha cae en un mes cerrado (`settings.lockedThrough`). Ponlo arriba del formulario. | `date` |
| `ConfirmModal` | Confirmación propia. Con `secondMessage` pide **doble confirmación** (todo lo destructivo). | `open`, `title`, `message`, `subject?`, `secondMessage?`, `danger?`, `loading?`, `error?` |
| `FormDialog` / `EditorDialog` | Modal de formulario / el mismo atado a `useEditor` (doble confirmación al desactivar). | `editor`, `titleNew`, `titleEdit`, `readonly?`, `wide?` |
| `EmptyState`, `UnderConstruction`, `SearchInput`, `AppIcon` | Vacío/error/éxito con ilustración (icono grande en círculo tenue), pantalla pendiente, buscador, iconos (`icons.ts`). | `EmptyState`: `tone?: 'empty'\|'error'\|'success'\|'construction'`, `icon?` |
| `PageHeader` (icono) | Sale solo: el icono de la pantalla (el mismo del menú, `layout/screenIcons.ts`). `icon?` para otro. | `icon?` |

**Color con significado** (`levels.ts`, tokens `$success/$warning/$danger/$info` + `-bg` + `-line` y `$neutral`):
rojo = actuar hoy, ámbar = revisar, azul = informativo, verde = al día. Nunca decorativo y nunca solo
(siempre con icono o texto). **Iconos de acciones principales** (usa estos nombres): Nuevo `plus`, Grabar `save`
(o `check`), Anular `void`, Imprimir `print`, Excel `excel`, Reintentar SRI `send`, Actualizar `refresh`.

```vue
<AlertBanner level="warning" :title="t.noRate" message="Sin tasa de IVA no se puede emitir." action-label="Configurar" :to="{ name: 'Company' }" closable />
<LockedDateBanner :date="doc.date" />
```

```vue
<FormField v-bind="site.catalogs.products.fields.price" for="price" required>
  <MoneyInput id="price" v-model="line.price" />   <!-- line.price: centavos -->
</FormField>
<ConfirmModal :open="voiding" danger title="Anular factura" :subject="doc.number"
  message="Se genera el asiento de reverso y se devuelve el stock."
  second-message="Confírmalo otra vez: la factura queda anulada." second-label="Sí, anular"
  :loading="saving" @confirm="voidDoc" @cancel="voiding = false" />
```

## Carga y movimiento

Que nada aparezca en blanco ni de golpe. Ya resuelto en las piezas compartidas (no lo repitas en la vista):
barra superior al navegar y con cualquier petición al API que tarde más de 200 ms (`TheProgressBar` +
`httpBase`), cambio de pantalla con fundido, modales/diálogos/popovers/toasts con entrada y salida,
y el código de una pantalla se precarga al pasar el mouse por su enlace del menú. Todo se vuelve
instantáneo con `prefers-reduced-motion` (`styles/motion.scss`).

| Pieza | Para qué | Props clave |
|---|---|---|
| `BaseButton` | Botón de acción async: spinner, mismo ancho y deshabilitado mientras corre (sin doble envío). Ya lo usan `FormDialog`, `ConfirmModal` y `EditorDialog`. | `variant?: 'primary'\|'dark'\|'ghost'\|'danger'` (ghost), `size?: 'sm'`, `icon?`, `type?`, `loading?`, `disabled?`, `action?: () => Promise` |
| `SkeletonBlock` | Espacio reservado con brillo mientras llegan datos (detalle, paneles, gráficos). Pon `aria-busy` en el contenedor. | `width?`, `height?`, `lines?` (párrafo), `radius?` |
| `KpiCard` / `SalesChart` | Con `loading` se dibujan como skeleton. | `loading?` |
| `DataTable` | Primera carga: filas skeleton con la forma de las columnas. Recarga con filas: las deja visibles, atenuadas, con una línea arriba (no vuelve a blanco). | `loading` |

Transiciones globales para `<Transition name="…">`: `fade`, `rise`, `pop` (paneles), `modal` (fondo +
primer hijo), y `<TransitionGroup name="list">` para listas cortas (no para tablas ni `DocumentLines`).

```vue
<!-- Botón que llama al API: con `action` el botón lleva su propio estado -->
<BaseButton variant="primary" icon="check" :action="save">Guardar</BaseButton>
<!-- o con el estado de la vista (useEditor, un form) -->
<BaseButton type="submit" variant="primary" :loading="saving">Guardar</BaseButton>

<!-- Detalle: skeleton en la primera carga; si ya hay datos, se muestran mientras se refresca -->
<section class="panel panel--pad" :aria-busy="loading">
  <SkeletonBlock v-if="loading && !doc" :lines="4" />
  <DocDetail v-else-if="doc" :doc="doc" />
</section>

<!-- Tablero mientras llega el primer dato -->
<div v-if="!data && loading" class="db__cards"><KpiCard v-for="n in 4" :key="n" loading /></div>
<SalesChart :series="data?.sales?.series ?? []" :loading="loading" :title="t.chart.title" :empty="t.chart.empty" />
```

## table/

**`DataTable`** — listados y reportes. Columnas `Column<T>` (`columns.ts`):
`{ key, label, help?, format?: 'text'|'money'|'qty'|'date'|'int'|'amount-signed'|'qty-stock'|'days-overdue', align?, width?, total?, value?: (row) => …, min?: (row) => number, screenOnly? }`.

**Indicadores** (solo cambia la columna; en Excel/impresión salen como su número o texto, sin color):

| `format` | Valor | Se ve |
|---|---|---|
| `amount-signed` | centavos | como `money`; negativos en rojo |
| `qty-stock` | cantidad + `min: (r) => r.minQty` | como `qty`; bajo el mínimo ámbar ⚠, negativo rojo |
| `days-overdue` | días de atraso o la fecha de vencimiento | chip "Al día" verde / "5 días" ámbar / "+90 · 120 días" rojo |

Filas por nivel: `rowClass: (r) => r.daysOverdue > 90 ? 'is-danger' : r.daysOverdue > 0 ? 'is-warning' : undefined`
(fondo tenue + franja a la izquierda; `is-void` sigue tachando anuladas).

```ts
{ key: 'dueDate', label: 'Vence', format: 'days-overdue' },
{ key: 'qty', label: 'Existencia', format: 'qty-stock', min: (r) => r.minQty },
{ key: 'balance', label: 'Saldo', format: 'amount-signed', total: true },
```

Props: `columns`, `rows`, `loading`, `error`, `page`/`pages`/`total` (paginación del servidor,
emite `update:page`), `totals?` (del servidor; si no, suma las filas), `title?`, `filtersText?: string[]`
(para la hoja impresa), `fetchAll?` (trae todas las páginas para Excel/PDF), `landscape?`, `clickable`
(emite `row-click`), `rowClass?` (`'is-void'` tacha filas anuladas), `emptyTitle?`/`emptyMessage?` (tabla vacía: qué hacer).
Columna con `help?` → (?) en el encabezado (no sale en Excel ni impresión). Slots: `toolbar`, `cell-<key>`, `empty`.
Botones **Excel** (`write-excel-file`, dólares reales) e **Imprimir / PDF** (`printReport` → `ThePrintSheet`:
razón social, RUC, título, filtros y pie con usuario y fecha/hora).

```vue
<DataTable :columns="[
    { key: 'date', label: 'Fecha', format: 'date' },
    { key: 'party.name', label: 'Cliente' },
    { key: 'total', label: 'Total', format: 'money', total: true },
    { key: 'sriStatus', label: 'SRI' } ]"
  :rows="list.items" :loading="list.loading" :error="list.error"
  :page="list.page" :pages="list.pages" :total="list.total" :fetch-all="list.fetchAll"
  :filters-text="summary" @update:page="list.page = $event">
  <template #cell-sriStatus="{ row }"><StatusBadge :status="row.sriStatus" /></template>
</DataTable>
```

`useList(fetch, filters?)` (composables) da `{ q, page, items, total, pages, loading, error, reload, fetchAll }`
con búsqueda con espera y vuelta a página 1 al cambiar filtros. Para imprimir algo que no es una tabla:
`printReport({ title, filters, columns, rows, totals })` de `composables/usePrint.ts`.

## notifications/

Avisos de la campana (`GET /api/notifications`, calculados al vuelo según el rol: SRI rechazado/sin firma,
cheques por depositar, cartera +30/+90, CxP vencida y pagos aprobados, stock bajo/negativo, conciliaciones
abiertas, mes sin cerrar, SRI en pruebas). Store `useNotificationsStore` (`stores/notifications.ts`): `items`,
`unseen`, `worst`, `markSeen`, `summary(match)`; lo visto va en localStorage por usuario y vuelve a ser nuevo si
cambia la cantidad. `NotificationBell` (topbar) refresca cada 2 min y al volver a la pestaña, y lanza un toast
con cada aviso rojo nuevo; el menú lateral muestra el conteo por módulo y pantalla. `NotificationItem` pinta
un aviso (lo usan el panel, `/notificaciones` y el tablero). Un aviso nuevo se agrega en el back
(`notifications.service.ts` del API), no aquí.

## report/

**`ReportFilters`** — `v-model` = `ReportFilterValues` (`defaultFilters()` = primero del mes → hoy),
`fields?: ('range'|'warehouse'|'party'|'product'|'account'|'bankAccount')[]`, `partyRole?`, `loading?`;
slot para filtros propios. Emite `apply(summary: string[])` → pásalo a `DataTable :filters-text`.
`filterParams(values)` deja solo los filtros con valor para `params` del API.

```vue
<ReportFilters v-model="filters" :fields="['range', 'warehouse', 'product']" @apply="run" />
```

## pickers/

Todos con `id`, `v-model`, `invalid?`, `disabled?`; los remotos con `clearable?` y evento `pick` con el registro completo.

| Picker | v-model | Notas |
|---|---|---|
| `PartyPicker` | `_id` | `role?: 'customer'\|'supplier'\|'employee'`. Busca por nombre o RUC; un RUC/cédula exacto se autollena con `/catalog/parties/by-id/:id`. `@pick="(p) => fill(p)"`. |
| `ProductPicker` | `_id` | `pick` trae unidad, factor, IVA y precios. |
| `AccountPicker` | código | Solo cuentas de **movimiento**; muestra código + nombre. |
| `WarehousePicker` | `_id` | `emptyLabel?` para filtros ("Todas"). |
| `BankAccountPicker` | `_id` | `kind?: 'banco'\|'caja'`; la cuenta contable está en `catalog.bankAccounts`. |

Base común: `RemotePicker` (búsqueda con espera, teclado, `exact` para autoselección).

## documents/

**`DocumentLines`** — grilla editable genérica. `v-model` = array de líneas, `columns: LineColumn[]`
(`{ key, label, type?: 'text'|'money'|'qty'|'product'|'account'|'readonly', width?, total?, format?, value? }`),
`newLine: () => L`, `readonly?`, `idPrefix?`. Agregar al final, insertar arriba y eliminar (líneas sin grabar:
sin confirmación). Emite `pick-product(line, product)` y `pick-account(line, account)`. Slot `cell-<key>`.
En el teléfono cada línea es una tarjeta.

```vue
<DocumentLines v-model="doc.lines" :new-line="() => ({ productId: '', qty: null, price: null })"
  :columns="[
    { key: 'productId', label: 'Producto', type: 'product', width: '40%' },
    { key: 'qty', label: 'Cantidad', type: 'qty', total: true },
    { key: 'price', label: 'Precio', type: 'money' },
    { key: 'total', label: 'Total', type: 'readonly', format: 'money', total: true,
      value: (l) => Math.round((l.qty ?? 0) * (l.price ?? 0)) } ]"
  @pick-product="(line, p) => (line.price = p?.prices[0]?.price ?? null)" />
```

**`EntryPreview`** — asiento: `lines: EntryLine[]` (`{ accountCode, accountName?, description?, debit, credit }`
en centavos), `title?`. Muestra totales y badge **Cuadra / Descuadre $x**.

## catalogs/

Formularios de catálogos (`PartyForm`, `ProductForm`) usados por las vistas de `views/configuracion/`.
