# CLAUDE.md

Front del ERP de Importadora Tapia: reemplaza al "SISTEMA INTEGRADO" de Macio con los mismos módulos y
nombres (el contador debe encontrar todo donde lo busca hoy). Vue 3.5 + Vite 7 + TypeScript, SCSS propio,
Pinia 3, vue-router 4, axios. API en el repo hermano `../erp-importadora-tapia-backapp` (léelo: su
CLAUDE.md trae las reglas contables). Visión y alcance: `../VISION.md`.

## Comandos

```sh
pnpm install
pnpm dev          # :5173 — necesita el API en :8100 (en el back: pnpm dev:memory, admin@importadoratapia.app / tapia2026)
pnpm build        # vue-tsc -b && vite build (el type-check corre acá)
pnpm test         # node --test src/**/*.test.ts (utilidades de dinero)
pnpm lint         # eslint (incluye la regla de 300 líneas por .vue)
```

El API solo acepta CORS de `localhost:5173`, `5174` y `127.0.0.1:5173`: si cambias el puerto, usa uno de esos.
Usuarios demo (misma clave): `contabilidad@`, `facturacion@`, `bodega@importadoratapia.app`.

## Reglas duras

- **Montos en CENTAVOS enteros**, igual que el API (`12345` = $123.45). Nunca sumes dólares en float.
  `formatMoney(cents)` → "$1,234.56"; `toCents("1.234,56" | "1234.56")` → 123456 (`src/utils/money.ts`,
  con su prueba). En formularios, `<MoneyInput v-model="centavos">`. Cantidades con 4 decimales
  (`QtyInput`, `toQty`, `roundQty`). Fechas de documento `AAAA-MM-DD` (`BaseDatePicker`, `todayISO()`).
- **Ningún archivo pasa de 300 líneas** (eslint lo exige en `.vue`). La salida es sacar lógica a un
  composable o a un subcomponente, no partir en dos de 290.
- **Layout con flexbox, nunca grid.** Formularios con `.form-grid` (flex-wrap); tarjetas con `flex-cards()`.
- **Mobile first**: estilos base para teléfono y `@include from('md')` para crecer.
- **Nada de controles nativos de selección ni diálogos del navegador**: ni `<select>`, ni `type="date"`, ni
  checkbox, ni `alert`/`confirm`. Usar `BaseCombobox`, `BaseSegmented`, `BaseDatePicker`, `BaseSwitch`,
  `ConfirmModal`. **Todo lo destructivo (anular, cerrar mes, desactivar, pasar a producción) lleva
  doble confirmación** (`ConfirmModal` con `secondMessage`).
- **Iconos solo con `<AppIcon name="…" />`**; el mapa nombre → clase de Font Awesome está en
  `src/components/ui/icons.ts`. Nada de SVG a mano ni emojis.
- **El copy vive en `src/config/site.ts`** (y `src/config/copy/*.ts`, que se juntan ahí). Cada campo
  lleva ayuda (`help`) que se ve con `HelpTip`/`FormField`: el cliente lo pidió.
- **Estética sobria**: blanco, negro, grises y azules (`styles/colorVariables.module.scss`); color solo
  para estados (`StatusBadge`). Números tabulares a la derecha (`.num`, `format: 'money'`).
- Nada de librerías UI ni Tailwind. Todo `VITE_*` queda expuesto en el navegador: nunca un secreto.

## Estilos: la trampa de `additionalData`

`vite.config.ts` antepone `@/styles/index.scss` a **cada** `<style lang="scss">`: ahí solo variables,
`@forward`, funciones y mixins (nada que emita CSS). Lo que emite CSS va en `global.scss` (reset, botones),
`controls.scss` (campos propios, popovers), `utilities.scss` (`.panel`, `.form-grid`, `.toolbar`, `.num`)
y `print.scss`, importados una vez desde `main.ts`. En componentes: `$ink`, `$accent`, `@include from('md')`.

## Mapa de carpetas

```
src/
  config/site.ts           copy, empresa (encabezado de reportes), módulos de la barra, roles, estados
  config/copy/             copy de catálogos (con ayudas) y del mapa contable
  config/access.ts         matriz rol → módulo ('write' | 'read' | 'none'), canView / canWrite
  router/index.ts          login + layout + guard (sesión vía /auth/me y permiso por rol)
  router/defineModule.ts   arma rutas y menú de un módulo
  router/modules/<m>.ts    UNA por módulo: inicio, bancos, contabilidad, cxp, facturacion, cxc, impuestos,
                           inventario, configuracion
  views/<modulo>/          una pantalla = un .vue (los pendientes muestran <UnderConstruction />)
  views/configuracion/     catálogos hechos (también montados en el submenú Mantenimientos de cada módulo)
  layout/                  DashboardLayout, AppSidebar, AppTopbar, ThePrintSheet, TheProgressBar
  components/              piezas compartidas — ver components/README.md (props y ejemplos)
  composables/             useList, useEditor, useAccess, useNavigation, usePrint, useRemoteSearch…
  services/                httpBase (Bearer, 401 → auth:token-expired), auth, catalog, settings
  stores/                  user (sesión, rol), catalog (bodegas, bancos, grupos, settings en caché), toast
  types/                   tipos del API (catalog.ts espeja los modelos del back)
  utils/                   money, format (fechas), excel, tableExport
```

## Cómo agregar o construir una pantalla de módulo

1. Entra solo a tu `src/router/modules/<modulo>.ts`. Cada entrada es ruta **y** opción del menú, en ese
   orden: `{ path, name, title, section: 'procesos' | 'mantenimientos' | 'reportes' | 'especiales' | 'general',
   component, writers?, adminOnly?, hidden?, props? }`. `hidden: true` para detalles (`facturas/:id`).
   `writers` = roles que graban (además de gerencia), igual que `requireRoles` del API.
2. Reemplaza el placeholder `src/views/<modulo>/XView.vue` (su comentario `// Pendiente:` dice qué va).
3. Servicio nuevo en `src/services/<modulo>.service.ts` (`class XService extends APIBase`), tipos en
   `src/types/<modulo>.ts` y reexportados desde `types/index.ts`. Copy en `src/config/copy/<modulo>.ts`
   y súmalo a `site`.
4. Usa las piezas: `PageHeader`, `ReportFilters` + `DataTable` (Excel e impresión ya incluidos) para
   reportes; `PartyPicker`/`ProductPicker`/`AccountPicker`/`WarehousePicker`/`BankAccountPicker`,
   `DocumentLines`, `EntryPreview` y `MoneyInput` para documentos; `useList` para listados paginados;
   `useAccess().canWrite` para esconder botones de grabar; `StatusBadge` para estados SRI/documento;
   filas anuladas con `rowClass: (r) => r.status === 'anulado' ? 'is-void' : undefined`.
5. `pnpm build` y `pnpm lint` sin errores.

## Roles (espejo de `src/config/access.ts`)

admin todo · contabilidad todo menos Usuarios · facturacion: Facturación, CxC e Inventario en lectura ·
cartera: CxC, Facturación en lectura · bodega: Inventario · auditor: todo en lectura · vendedor: solo
Inicio (pendiente de definir). Inicio lo ven todos.

## Arquitectura y convenciones

- Rutas lazy; `meta.title` se aplica en `afterEach`. El guard espera `/auth/me` si hay token: sin rol no
  se sabe qué mostrar.
- Errores del API: `{ status, message, data? }` (`ApiError`); `message` viene en español, va directo al toast.
- Listados del API: `{ items, total, page, pages }` (máx. 500 por página).
- `<script setup lang="ts">` siempre; script → template → style; `<style scoped lang="scss">`.
- Sin punto y coma, comillas simples, 2 espacios (Prettier). PascalCase; singletons de layout con
  prefijo `The`; vistas con sufijo `View`; BEM en clases.
- Comentarios y copy en español; explican el porqué, no el qué.
