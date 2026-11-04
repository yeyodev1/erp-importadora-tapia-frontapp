<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import InvoiceHeaderFields from '@/components/purchases/InvoiceHeaderFields.vue'
import InvoiceLinesBlock from '@/components/purchases/InvoiceLinesBlock.vue'
import WithholdingLines from '@/components/purchases/WithholdingLines.vue'
import { useInvoiceForm } from '@/composables/purchases/useInvoiceForm'
import { useAccess } from '@/composables/useAccess'
import { useToastStore } from '@/stores/toast'
import { cxp } from '@/config/copy/cxp'
import { accountingScreens } from '@/config/copy/accountingScreens'
import type { ApiError } from '@/types'

const t = cxp.invoices
const router = useRouter()
const toast = useToastStore()
const { canWrite } = useAccess()
const ctx = useInvoiceForm()
const saving = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

/** "Carga XML" del sistema actual: un archivo y se llena todo. */
async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const parsed = await ctx.loadXml(await file.text())
    if (parsed.duplicate) {
      toast.info(`La factura ${parsed.docNumber} ya está ingresada`)
      router.push({ name: 'SupplierInvoiceDetail', params: { id: parsed.existingId } })
    } else parsed.warnings.forEach((w) => toast.info(w))
  } catch (e) {
    toast.error((e as ApiError).message)
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function save() {
  error.value = ''
  if (!ctx.ready.value) {
    error.value = t.unbalanced
    return
  }
  saving.value = true
  try {
    const inv = await ctx.save()
    toast.success(t.saved)
    router.push({ name: 'SupplierInvoiceDetail', params: { id: inv._id } })
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="if">
    <PageHeader :subtitle="cxp.pages.invoiceNew">
      <RouterLink :to="{ name: 'SupplierInvoices' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> Facturas</RouterLink>
    </PageHeader>

    <div class="if__body">
      <LockedDateBanner :date="ctx.form.date" />
      <InvoiceHeaderFields :ctx="ctx">
        <template #xml>
          <span v-if="canWrite" class="if__xml">
            <label class="btn btn--sm btn--primary if__file">
              <AppIcon name="upload" /> {{ t.loadXml }}
              <input ref="fileInput" type="file" accept=".xml,text/xml,application/xml" class="if__input" @change="onFile" />
            </label>
            <HelpTip :text="t.loadXmlHelp" :label="t.loadXml" />
          </span>
        </template>
      </InvoiceHeaderFields>
      <InvoiceLinesBlock :ctx="ctx" />
      <WithholdingLines :ctx="ctx" />
      <section class="panel panel--pad if__entry">
        <p class="form-section">{{ t.entryTitle }} <HelpTip :text="t.entryHelp" :label="t.entryTitle" /></p>
        <EntryPreview :lines="ctx.entry.value" />
      </section>

      <p v-if="error" class="if__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      <div v-if="canWrite" class="if__actions">
        <span class="if__mayor">{{ accountingScreens.mayorizedNote }} <HelpTip :text="accountingScreens.mayorized.help" :label="accountingScreens.mayorized.label" /></span>
        <BaseButton variant="primary" icon="check" :loading="saving" @click="save">{{ t.save }}</BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.if__body {
  @include flex(column, stretch, flex-start, 1rem);
}

.if__file {
  position: relative;
  cursor: pointer;
}

// El input file queda invisible sobre el botón: se abre con clic y con teclado.
.if__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.if__error {
  @include flex(row, center, flex-start, 0.5rem);
  color: $danger;
  background: $danger-bg;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
}

.if__actions {
  @include flex(row, center, flex-end, 0.5rem 1rem);
  flex-wrap: wrap;
}

.if__mayor,
.if__xml {
  @include flex(row, center, flex-start, 0.35rem);
}

.if__mayor {
  font-size: 0.85rem;
  color: $ink-soft;
}

.if__entry {
  @include flex(column, stretch, flex-start, 0.5rem);
}
</style>
