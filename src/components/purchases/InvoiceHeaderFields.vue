<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import { useToastStore } from '@/stores/toast'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { useInvoiceForm } from '@/composables/purchases/useInvoiceForm'

/**
 * Bloques Proveedor, Comprobante, Sustento y Pago, en el mismo orden y con
 * los mismos nombres que "Transacciones proveedores" del sistema anterior.
 * Slot `xml`: el botón "Carga XML", que vive en el bloque Proveedor como hoy.
 */
const props = defineProps<{ ctx: ReturnType<typeof useInvoiceForm> }>()

const t = cxp.invoices
const b = t.blocks
const toast = useToastStore()
const creating = ref(false)
const form = computed(() => props.ctx.form)
const xmlSupplier = computed(() => props.ctx.xml.value?.parsed.supplier)
const fromXml = computed(() => Boolean(xmlSupplier.value && !xmlSupplier.value.existingId && !form.value.supplierId))
const shown = computed(() => {
  const s = props.ctx.supplier.value
  if (s && s._id === form.value.supplierId) return { name: s.name, address: s.address, phone: s.phone, email: s.email }
  const x = xmlSupplier.value
  return x ? { name: x.name, address: x.address, phone: '', email: '' } : null
})

async function createSupplier() {
  creating.value = true
  try {
    await props.ctx.createSupplierFromXml()
    toast.success('Proveedor creado')
  } catch (e) {
    toast.error((e as ApiError).message)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="ih">
    <section class="panel panel--pad ih__block ih__block--wide">
      <header class="ih__head">
        <h3 class="ih__title">{{ b.supplier }}</h3>
        <span class="ih__actions">
          <slot name="xml" />
          <button v-if="fromXml" type="button" class="btn btn--sm btn--primary" :disabled="creating" @click="createSupplier">
            <AppIcon :name="creating ? 'spinner' : 'plus'" :spin="creating" /> {{ t.createSupplier }}
          </button>
          <RouterLink v-else :to="{ name: 'PayablesSuppliers' }" target="_blank" class="btn btn--sm btn--ghost">
            <AppIcon name="plus" /> {{ t.createSupplier }}
          </RouterLink>
          <HelpTip :text="t.createSupplierHelp" :label="t.createSupplier" />
        </span>
      </header>
      <div class="form-grid">
        <FormField v-bind="t.fields.supplier" for="inv-supplier" required>
          <PartyPicker id="inv-supplier" v-model="form.supplierId" role="supplier" @pick="ctx.onSupplier" />
        </FormField>
      </div>
      <dl v-if="shown" class="ih__facts">
        <div v-for="(label, key) in t.supplierFacts" :key="key">
          <dt>{{ label }}</dt>
          <dd>{{ shown[key] || '—' }}</dd>
        </div>
      </dl>
      <p v-if="fromXml" class="ih__missing" role="status"><AppIcon name="info" /> {{ t.supplierMissing }}</p>
    </section>

    <section class="panel panel--pad ih__block ih__block--wide">
      <h3 class="ih__title">{{ b.voucher }}</h3>
      <div class="form-grid">
        <FormField v-bind="t.fields.docType" full>
          <BaseSegmented v-model="form.docType" :options="cxp.docTypes" :label="t.fields.docType.label" />
        </FormField>
        <FormField v-bind="t.fields.date" for="inv-date" required class="narrow">
          <BaseDatePicker id="inv-date" v-model="form.date" />
        </FormField>
        <FormField v-bind="t.fields.series" for="inv-series" required class="narrow">
          <input id="inv-series" v-model="form.series" class="mono" inputmode="numeric" maxlength="7" :placeholder="t.placeholders.series" />
        </FormField>
        <FormField v-bind="t.fields.number" for="inv-number" required class="narrow">
          <input id="inv-number" v-model="form.number" class="mono" inputmode="numeric" maxlength="9" :placeholder="t.placeholders.number" />
        </FormField>
        <FormField v-bind="t.fields.creditDays" for="inv-days" class="narrow">
          <input id="inv-days" v-model.number="form.creditDays" inputmode="numeric" class="num" :placeholder="t.placeholders.creditDays" />
        </FormField>
        <FormField v-bind="t.fields.authorization" for="inv-auth" full>
          <input id="inv-auth" v-model="form.authorization" class="mono" maxlength="49" :placeholder="t.placeholders.authorization" />
        </FormField>
        <FormField v-bind="t.fields.description" for="inv-desc" full>
          <input id="inv-desc" v-model="form.description" maxlength="200" :placeholder="t.placeholders.description" />
        </FormField>
      </div>
    </section>

    <section class="panel panel--pad ih__block">
      <h3 class="ih__title">{{ b.support }}</h3>
      <FormField v-bind="t.fields.goodsOrServices">
        <BaseSegmented v-model="form.goodsOrServices" :label="t.fields.goodsOrServices.label" :options="cxp.goodsOptions" />
      </FormField>
      <FormField v-bind="t.fields.taxSupport" for="inv-support">
        <BaseCombobox id="inv-support" v-model="form.taxSupport" :options="cxp.taxSupports" />
      </FormField>
    </section>

    <section class="panel panel--pad ih__block">
      <h3 class="ih__title">{{ b.payment }}</h3>
      <FormField v-bind="t.fields.paymentMethod" for="inv-pay">
        <BaseCombobox id="inv-pay" v-model="form.paymentMethod" :options="cxp.paymentMethods" />
      </FormField>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ih {
  @include flex(row, stretch, flex-start, 1rem);
  flex-wrap: wrap;
}

.ih__block {
  @include flex(column, stretch, flex-start, 0.75rem);
  flex: 1 1 100%;
  min-width: 0;

  @include from('md') {
    flex: 1 1 calc(50% - 0.5rem);
  }
}

.ih__block--wide {
  @include from('md') {
    flex-basis: 100%;
  }
}

.ih__head {
  @include flex(row, center, space-between, 0.5rem 1rem);
  flex-wrap: wrap;
}

.ih__title {
  font-size: 1rem;
  font-weight: 600;
}

.ih__actions {
  @include flex(row, center, flex-end, 0.5rem);
  flex-wrap: wrap;
}

.ih__facts {
  @include flex(row, flex-start, flex-start, 0.5rem 1.5rem);
  flex-wrap: wrap;
  margin: 0;
  font-size: 0.9rem;

  > div {
    @include flex(column, flex-start, flex-start, 0.1rem);
    min-width: 0;
  }

  dt {
    font-size: 0.8rem;
    color: $ink-muted;
  }

  dd {
    margin: 0;
    color: $ink-soft;
    overflow-wrap: anywhere;
  }
}

.ih__missing {
  @include flex(row, center, flex-start, 0.6rem);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  background: $info-bg;
  color: $info;
}
</style>
