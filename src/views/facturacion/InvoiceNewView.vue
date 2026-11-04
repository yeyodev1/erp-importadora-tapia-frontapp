<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import SaleDocForm from '@/components/sales/SaleDocForm.vue'
import { useSaleForm } from '@/composables/sales/useSaleForm'
import { salesService } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'

/** Nueva factura: al grabar abre el detalle, que muestra el resultado del SRI. */
const router = useRouter()
const toast = useToastStore()

const form = useSaleForm(async (body) => {
  const inv = await salesService.createInvoice(body)
  toast.success(`${t.invoices.created}: ${inv.number}`)
  router.replace({ name: 'InvoiceDetail', params: { id: inv._id } })
})
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.invoiceNew.subtitle" />
    <SaleDocForm :form="form" :submit-label="t.actions.save" id-prefix="inv" @cancel="router.push({ name: 'Invoices' })" />
  </section>
</template>
