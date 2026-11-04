<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import { useToastStore } from '@/stores/toast'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { useInvoiceForm } from '@/composables/purchases/useInvoiceForm'

/** Bloques Proveedor y Comprobante de la factura de proveedor. */
const props = defineProps<{ ctx: ReturnType<typeof useInvoiceForm> }>()

const t = cxp.invoices
const toast = useToastStore()
const creating = ref(false)
const form = computed(() => props.ctx.form)
const xmlSupplier = computed(() => props.ctx.xml.value?.parsed.supplier)
const shown = computed(() => {
  const s = props.ctx.supplier.value
  if (s && s._id === form.value.supplierId) return { ruc: s.identification, name: s.name, address: s.address }
  return xmlSupplier.value ?? null
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
  <section class="panel panel--pad ih">
    <div class="form-grid">
      <FormField v-bind="t.fields.supplier" for="inv-supplier" required>
        <PartyPicker id="inv-supplier" v-model="form.supplierId" role="supplier" @pick="ctx.onSupplier" />
      </FormField>
      <div v-if="shown" class="ih__party full">
        <strong>{{ shown.name }}</strong>
        <span class="mono">{{ shown.ruc }}</span>
        <span>{{ shown.address }}</span>
      </div>
      <div v-if="xmlSupplier && !xmlSupplier.existingId && !form.supplierId" class="ih__missing full" role="status">
        <AppIcon name="info" /> {{ t.supplierMissing }}
        <button type="button" class="btn btn--sm btn--primary" :disabled="creating" @click="createSupplier">
          <AppIcon :name="creating ? 'spinner' : 'plus'" :spin="creating" /> {{ t.createSupplier }}
        </button>
      </div>
    </div>

    <div class="form-grid">
      <FormField v-bind="t.fields.docType" full>
        <BaseSegmented v-model="form.docType" :options="cxp.docTypes" :label="t.fields.docType.label" />
      </FormField>
      <FormField v-bind="t.fields.series" for="inv-series" required class="narrow">
        <input id="inv-series" v-model="form.series" class="mono" inputmode="numeric" maxlength="7" placeholder="001-001" />
      </FormField>
      <FormField v-bind="t.fields.number" for="inv-number" required class="narrow">
        <input id="inv-number" v-model="form.number" class="mono" inputmode="numeric" maxlength="9" />
      </FormField>
      <FormField v-bind="t.fields.date" for="inv-date" required class="narrow">
        <BaseDatePicker id="inv-date" v-model="form.date" />
      </FormField>
      <FormField v-bind="t.fields.creditDays" for="inv-days" class="narrow">
        <input id="inv-days" v-model.number="form.creditDays" inputmode="numeric" class="num" />
      </FormField>
      <FormField v-bind="t.fields.authorization" for="inv-auth" full>
        <input id="inv-auth" v-model="form.authorization" class="mono" maxlength="49" />
      </FormField>
      <FormField v-bind="t.fields.taxSupport" for="inv-support">
        <BaseCombobox id="inv-support" v-model="form.taxSupport" :options="cxp.taxSupports" />
      </FormField>
      <FormField v-bind="t.fields.paymentMethod" for="inv-pay">
        <BaseCombobox id="inv-pay" v-model="form.paymentMethod" :options="cxp.paymentMethods" />
      </FormField>
      <FormField v-bind="t.fields.goodsOrServices">
        <BaseSegmented
          v-model="form.goodsOrServices"
          :label="t.fields.goodsOrServices.label"
          :options="[
            { value: 'bien', label: 'Bien' },
            { value: 'servicio', label: 'Servicio' },
          ]"
        />
      </FormField>
      <FormField v-bind="t.fields.description" for="inv-desc" full>
        <input id="inv-desc" v-model="form.description" maxlength="200" />
      </FormField>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ih {
  @include flex(column, stretch, flex-start, 1rem);
}

.ih__party {
  @include flex(row, baseline, flex-start, 0.75rem);
  flex-wrap: wrap;
  color: $ink-soft;
  font-size: 0.9rem;
}

.ih__missing {
  @include flex(row, center, flex-start, 0.6rem);
  flex-wrap: wrap;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  background: $info-bg;
  color: $info;
}
</style>
