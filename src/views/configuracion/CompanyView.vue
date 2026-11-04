<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAccess } from '@/composables/useAccess'
import { useSettingsForm } from '@/composables/useSettingsForm'
import { site } from '@/config/site'

const t = site.catalogs.company
const f = t.fields
const { canWrite } = useAccess()
const confirming = ref(false)

const { form, loading, saving, error, load, save, settings } = useSettingsForm(
  (s) => ({ company: s.company, sriEnvironment: s.sriEnvironment }),
  (v) => v,
)
const environments = [
  { value: 1 as const, label: t.sriTest, help: t.sriHelp[1] },
  { value: 2 as const, label: t.sriProd, help: t.sriHelp[2] },
]

// Pasar a producción es lo único irreversible en la práctica: doble confirmación.
function submit() {
  if (form.value?.sriEnvironment === 2 && settings()?.sriEnvironment !== 2) confirming.value = true
  else save()
}

async function confirmProduction() {
  await save()
  confirming.value = false
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle" />
    <EmptyState v-if="error && !form" tone="error" :message="error" class="panel" @retry="load" />
    <form v-else class="panel panel--pad company" @submit.prevent="submit">
      <div v-if="loading || !form" class="skeleton" style="height: 12rem"></div>
      <fieldset v-else class="form-grid" :disabled="!canWrite">
        <FormField v-bind="f.ruc" for="co-ruc" class="narrow">
          <input id="co-ruc" v-model.trim="form.company.ruc" class="mono" inputmode="numeric" maxlength="13" :placeholder="t.ph.ruc" />
        </FormField>
        <FormField v-bind="f.legalName" for="co-legal" full>
          <input id="co-legal" v-model="form.company.legalName" :placeholder="t.ph.legalName" />
        </FormField>
        <FormField v-bind="f.tradeName" for="co-trade">
          <input id="co-trade" v-model="form.company.tradeName" :placeholder="t.ph.tradeName" />
        </FormField>
        <FormField v-bind="f.address" for="co-addr">
          <input id="co-addr" v-model="form.company.address" :placeholder="t.ph.address" />
        </FormField>
        <FormField v-bind="f.specialTaxpayer" for="co-special">
          <input id="co-special" v-model="form.company.specialTaxpayer" :placeholder="t.ph.specialTaxpayer" />
        </FormField>
        <BaseSwitch v-model="form.company.keepsAccounting" v-bind="f.keepsAccounting" />

        <p class="form-section full">{{ t.sriTitle }}</p>
        <FormField v-bind="f.sriEnvironment" full>
          <BaseSegmented v-model="form.sriEnvironment" :options="environments" :label="f.sriEnvironment.label" />
        </FormField>
      </fieldset>

      <p v-if="error && form" class="company__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      <div v-if="canWrite && form" class="company__actions">
        <button type="submit" class="btn btn--primary" :disabled="saving">
          <AppIcon v-if="saving" name="spinner" spin /> {{ site.common.save }}
        </button>
      </div>
    </form>

    <ConfirmModal
      :open="confirming"
      danger
      :title="t.prodConfirm"
      :message="t.prodMessage"
      :second-message="t.prodSecond"
      :second-label="t.prodConfirm"
      :loading="saving"
      :error="error"
      @confirm="confirmProduction"
      @cancel="confirming = false"
    />
  </section>
</template>

<style scoped lang="scss">
.company {
  max-width: 860px;

  fieldset {
    border: none;
    min-width: 0;
  }

  &__error {
    margin-top: 0.75rem;
    font-size: $text-sm;
    color: $danger;
  }

  &__actions {
    @include flex(row, center, flex-end);
    margin-top: 1rem;
  }
}
</style>
