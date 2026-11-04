<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import { useAccess } from '@/composables/useAccess'
import { useSettingsForm } from '@/composables/useSettingsForm'
import { site } from '@/config/site'

/** Mapa contable: cada concepto de ACCOUNT_MAP_KEYS con su cuenta de movimiento. */
const t = site.accountMap
const { canWrite } = useAccess()
const { form, loading, saving, error, load, save } = useSettingsForm(
  (s) => ({ ...s.accounts }),
  (accounts) => ({ accounts }),
)
</script>

<template>
  <section>
    <PageHeader :subtitle="t.intro" />
    <EmptyState v-if="error && !form" tone="error" :message="error" class="panel" @retry="load" />
    <form v-else class="map" @submit.prevent="save">
      <div v-if="loading || !form" class="panel skeleton" style="height: 16rem"></div>
      <template v-else>
        <section v-for="g in t.groups" :key="g.title" class="panel panel--pad">
          <h2 class="map__title">{{ g.title }}</h2>
          <fieldset class="form-grid map__fields" :disabled="!canWrite">
            <FormField v-for="key in g.keys" :key="key" v-bind="t.keys[key]" :for="`map-${key}`" class="map__field">
              <AccountPicker :id="`map-${key}`" v-model="form[key]" clearable />
            </FormField>
          </fieldset>
        </section>
      </template>

      <div v-if="form" class="map__bar">
        <p v-if="error" class="map__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
        <BaseButton v-if="canWrite" type="submit" variant="primary" icon="save" :loading="saving">{{ site.common.save }}</BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
.map {
  @include flex(column, stretch, flex-start, 0.75rem);
  max-width: 1000px;

  &__fields {
    border: none;
    min-width: 0;
  }

  &__title {
    @include eyebrow;
    margin-bottom: 0.75rem;
  }

  &__field {
    flex-basis: 320px;
  }

  // Botón de guardar siempre a la vista en formularios largos
  &__bar {
    position: sticky;
    bottom: 0;
    @include flex(row, center, flex-end, 0.75rem);
    padding: 0.6rem 0;
    background: linear-gradient(transparent, $paper 30%);
  }

  &__error {
    font-size: $text-sm;
    color: $danger;
    margin-right: auto;
  }
}
</style>
