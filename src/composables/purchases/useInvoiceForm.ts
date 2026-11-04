import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { catalogService } from '@/services/catalog.service'
import { purchasesService } from '@/services/purchases.service'
import { useCatalogStore } from '@/stores/catalog'
import { todayISO } from '@/utils/format'
import type { Party, Product, ProductGroup } from '@/types'
import type { ParsedXml, WithholdingCode } from '@/types/purchases'
import { computeInvoice, entryReady, invoiceEntry, type ExpenseLine, type ProductLine, type WithholdingInput } from './invoiceMath'

/** XML que ImportXmlView deja listo para abrir en el formulario (vive mientras la pestaña esté abierta). */
const xmlDraft = shallowRef<{ xml: string; parsed: ParsedXml } | null>(null)
export const setXmlDraft = (xml: string, parsed: ParsedXml) => (xmlDraft.value = { xml, parsed })

export const blankExpense = (accountCode = ''): ExpenseLine => ({ accountCode, description: '', base0: null, baseVat: null })
export const blankProduct = (): ProductLine => ({ productId: '', description: '', qty: null, subtotal: null, vatRate: 0, accountCode: '' })
export const blankWithholding = (): WithholdingInput => ({ codeId: '', base: null, rate: null })

/**
 * Estado y reglas de "Nueva factura de proveedor": autollenado desde el
 * proveedor o el XML, totales, retenciones y la vista previa del asiento
 * (el mismo que arma el API, para ver que cuadra antes de grabar).
 */
export function useInvoiceForm() {
  const catalog = useCatalogStore()
  const codes = ref<WithholdingCode[]>([])
  const xml = shallowRef<{ xml: string; parsed: ParsedXml } | null>(null)
  const supplier = ref<Party | null>(null)

  const form = reactive({
    supplierId: '',
    docType: '01',
    series: '',
    number: '',
    date: todayISO(),
    authorization: '',
    accessKey: '',
    creditDays: null as number | null,
    taxSupport: '01',
    goodsOrServices: 'bien' as 'bien' | 'servicio',
    paymentMethod: '20',
    description: '',
    lineKind: 'gasto' as 'gasto' | 'producto',
    warehouseId: '',
    expenseLines: [blankExpense()],
    productLines: [blankProduct()],
    vat: null as number | null,
    withholdings: [] as WithholdingInput[],
    withholdingSeries: '001-001',
  })

  const expense = computed(() => (form.lineKind === 'gasto' ? form.expenseLines : []))
  const products = computed(() => (form.lineKind === 'producto' ? form.productLines : []))
  const totals = computed(() =>
    computeInvoice({ expenseLines: expense.value, productLines: products.value, vatOverride: form.vat, withholdings: form.withholdings, codes: codes.value }),
  )
  const entry = computed(() => invoiceEntry(totals.value, expense.value, products.value, catalog.settings?.accounts ?? {}))
  const ready = computed(
    () =>
      Boolean(form.supplierId) &&
      entryReady(entry.value) &&
      totals.value.payable >= 0 &&
      totals.value.withholdings.every((w) => w.rate != null && w.rate >= 0 && w.rate <= 100),
  )

  onMounted(async () => {
    await Promise.all([catalog.ensure('settings'), catalog.ensure('productGroups')])
    codes.value = (await purchasesService.listCodes({ limit: 500 })).items
    if (xmlDraft.value) {
      applyXml(xmlDraft.value.xml, xmlDraft.value.parsed)
      xmlDraft.value = null
    }
  })

  /** Al elegir proveedor: días crédito y cuenta de gasto por defecto. */
  function onSupplier(party: Party | null) {
    supplier.value = party
    if (!party) return
    if (form.creditDays == null || !xml.value) form.creditDays = party.supplier?.creditDays ?? 0
    const account = party.supplier?.defaultExpenseAccount
    if (account) form.expenseLines.filter((l) => !l.accountCode).forEach((l) => (l.accountCode = account))
  }

  function applyXml(text: string, parsed: ParsedXml) {
    xml.value = { xml: text, parsed }
    const inv = parsed.invoice
    const [est, pto, seq] = inv.docNumber.split('-')
    Object.assign(form, {
      supplierId: parsed.supplier.existingId ?? '',
      docType: inv.docType,
      series: `${est}-${pto}`,
      number: seq,
      date: inv.date,
      authorization: inv.authorization,
      accessKey: inv.accessKey,
      creditDays: inv.creditDays,
      paymentMethod: inv.paymentMethod || '20',
      vat: inv.vat,
      lineKind: 'gasto',
      description: inv.lines.map((l) => l.description).join(' · ').slice(0, 200),
      expenseLines: [{ ...blankExpense(), base0: inv.base0 || null, baseVat: inv.baseVat || null, description: inv.lines[0]?.description ?? '' }],
    })
    if (parsed.supplier.existingId) catalogService.getOne('parties', parsed.supplier.existingId).then(onSupplier)
  }

  async function loadXml(text: string) {
    const parsed = await purchasesService.importXml(text)
    if (!parsed.duplicate) applyXml(text, parsed)
    return parsed
  }

  /** El proveedor del XML no existe: se crea (o se marca como proveedor) con los datos del XML. */
  async function createSupplierFromXml() {
    if (!xml.value) return
    const parsed = await purchasesService.importXml(xml.value.xml, true)
    xml.value = { xml: xml.value.xml, parsed }
    form.supplierId = parsed.supplier.existingId ?? ''
  }

  /** Producto elegido: IVA del producto y cuenta de inventario de su grupo. */
  function onProduct(line: ProductLine, p: Product | null) {
    if (!p) return
    const group = typeof p.groupId === 'string' ? catalog.productGroups.find((g) => g._id === p.groupId) : (p.groupId as ProductGroup)
    Object.assign(line, { description: p.name, vatRate: p.vatRate === 15 ? 15 : 0, accountCode: group?.accounts.inventory ?? '' })
  }

  /** Código elegido: tasa sugerida y base por defecto (subtotal para renta, IVA para IVA). */
  function onCode(w: WithholdingInput) {
    const code = codes.value.find((c) => c._id === w.codeId)
    if (!code) return
    w.rate = code.rate
    if (w.base == null) w.base = code.tax === 'iva' ? totals.value.vat : totals.value.base0 + totals.value.baseVat
  }

  function body() {
    const [establishment, emissionPoint] = form.withholdingSeries.split('-')
    const electronic = /^\d{49}$/.test(form.authorization) ? form.authorization : ''
    return {
      supplierId: form.supplierId,
      docType: form.docType,
      series: form.series,
      number: form.number,
      date: form.date,
      authorization: form.authorization,
      accessKey: form.accessKey || electronic,
      creditDays: form.creditDays ?? 0,
      taxSupport: form.taxSupport,
      goodsOrServices: form.goodsOrServices,
      paymentMethod: form.paymentMethod,
      description: form.description,
      expenseLines: expense.value.map((l) => ({ ...l, base0: l.base0 ?? 0, baseVat: l.baseVat ?? 0 })),
      productLines: products.value.filter((l) => l.productId).map(({ productId, qty, subtotal, vatRate, description }) => ({ productId, qty, subtotal, vatRate, description })),
      warehouseId: form.lineKind === 'producto' ? form.warehouseId : undefined,
      vat: form.vat ?? undefined,
      withholdings: totals.value.withholdings.map((w) => ({ codeId: w.codeId, base: w.base ?? 0, rate: w.rate ?? 0, amount: w.amount })),
      withholdingEstablishment: establishment,
      withholdingEmissionPoint: emissionPoint,
    }
  }

  const save = () => purchasesService.createInvoice(body())

  return { form, codes, xml, supplier, totals, entry, ready, onSupplier, onProduct, onCode, loadXml, createSupplierFromXml, save }
}
