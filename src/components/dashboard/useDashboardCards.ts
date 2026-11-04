import { computed, type Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/components/ui/icons'
import type { Level } from '@/components/ui/levels'
import type { Dashboard } from '@/services/dashboard.service'
import { formatMoney } from '@/utils/money'
import { dashboard as t } from '@/config/copy/dashboard'

export interface Card {
  key: string
  title: string
  value: string
  icon: IconName
  to: RouteLocationRaw
  hint?: string
  /** Qué significa la cifra (HelpTip junto al título). */
  help?: string
  delta?: number | null
  /** Semáforo de la tarjeta y su texto (el color nunca va solo). */
  level?: Level
  levelLabel?: string
}

const C = t.cards
const n = (v: number) => v.toLocaleString('en-US')
/** Verde si no hay nada pendiente; si hay, el nivel indicado. */
const light = (pending: number, level: Level = 'warning') =>
  pending > 0 ? { level, levelLabel: level === 'danger' ? t.levels.danger : t.levels.warning } : { level: 'success' as const, levelLabel: t.levels.ok }

/** Tarjetas del tablero: solo las secciones que el API mandó para el rol; cada una enlaza a su pantalla. */
export function useDashboardCards(data: Ref<Dashboard | null>) {
  return computed<Card[]>(() => {
    const d = data.value
    if (!d) return []
    const cards: Card[] = []
    if (d.sales) {
      const { current, previous } = d.sales
      cards.push({
        key: 'sales',
        title: C.sales,
        help: C.salesHelp,
        value: formatMoney(current.sales),
        icon: 'invoice',
        to: { name: 'SalesReport' },
        hint: `${n(current.count)} ${C.invoices} · ${C.salesHint}`,
        // shortcut: % en float solo para mostrar; los montos siguen en centavos enteros.
        delta: previous.sales ? ((current.sales - previous.sales) / previous.sales) * 100 : null,
      })
    }
    if (d.receivables) {
      const r = d.receivables
      cards.push({ key: 'receivables', title: C.receivables, help: C.receivablesHelp, value: formatMoney(r.total), icon: 'receivables', to: { name: 'Aging' }, hint: `${formatMoney(r.overdue)} ${C.overdue}`, ...light(r.overdue) })
    }
    if (d.payables) {
      const o = d.payables.overdue
      cards.push({ key: 'payables', title: C.payables, help: C.payablesHelp, value: formatMoney(o.amount), icon: 'payables', to: { name: 'SupplierBalances' }, hint: `${n(o.count)} ${C.invoices}`, ...light(o.amount, 'danger') })
    }
    if (d.lowStock) {
      cards.push({ key: 'lowStock', title: C.lowStock, help: C.lowStockHelp, value: n(d.lowStock.products), icon: 'inventory', to: { name: 'StockBalances' }, hint: C.products, ...light(d.lowStock.products) })
    }
    if (d.postdatedChecks) {
      const p = d.postdatedChecks
      cards.push({ key: 'checks', title: C.checks, help: C.checksHelp, value: formatMoney(p.amount), icon: 'wallet', to: { name: 'PostdatedChecks' }, hint: `${n(p.count)} · ${C.checksHint}`, ...light(p.count) })
    }
    if (d.sriPending) {
      const s = d.sriPending
      const parts = Object.entries(C.sriParts).map(([k, label]) => `${label} ${n(s[k as keyof typeof s] ?? 0)}`)
      cards.push({ key: 'sri', title: C.sri, help: C.sriHelp, value: n(s.total), icon: 'send', to: { name: 'Invoices' }, hint: parts.join(' · '), ...light(s.total, 'danger') })
    }
    return cards
  })
}
