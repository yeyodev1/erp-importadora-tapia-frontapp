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
| `BaseDatePicker` | Fecha `AAAA-MM-DD` (reemplaza `type=date`). | `id`, `rangeStart?`, `rangeEnd?`, `clearable?` |
| `BaseSwitch` | Interruptor (reemplaza checkbox). | `label`, `hint?`, `help?`, `disabled?` |
| `BaseSegmented` | Pocas opciones visibles / pestañas. | `options: {value,label,count?}[]`, `tabs?` |
| `BaseBadge` / `StatusBadge` | Etiqueta de color / estado de documento (`autorizado`, `anulado`, `pendiente`…, mapa en `site.status`). | `tone` / `status` |
| `ConfirmModal` | Confirmación propia. Con `secondMessage` pide **doble confirmación** (todo lo destructivo). | `open`, `title`, `message`, `subject?`, `secondMessage?`, `danger?`, `loading?`, `error?` |
| `FormDialog` / `EditorDialog` | Modal de formulario / el mismo atado a `useEditor` (doble confirmación al desactivar). | `editor`, `titleNew`, `titleEdit`, `readonly?`, `wide?` |
| `EmptyState`, `UnderConstruction`, `SearchInput`, `AppIcon` | Vacío/error, pantalla pendiente, buscador, iconos (`icons.ts`). | |

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
`{ key, label, format?: 'text'|'money'|'qty'|'date'|'int', align?, width?, total?, value?: (row) => …, screenOnly? }`.

Props: `columns`, `rows`, `loading`, `error`, `page`/`pages`/`total` (paginación del servidor,
emite `update:page`), `totals?` (del servidor; si no, suma las filas), `title?`, `filtersText?: string[]`
(para la hoja impresa), `fetchAll?` (trae todas las páginas para Excel/PDF), `landscape?`, `clickable`
(emite `row-click`), `rowClass?` (`'is-void'` tacha filas anuladas). Slots: `toolbar`, `cell-<key>`, `empty`.
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
