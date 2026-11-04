<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import StatementResults from './StatementResults.vue'
import { COLUMN_KEYS, useStatementMatch } from '@/composables/banks/useStatementMatch'
import type { Reconciliation } from '@/services/banks.service'
import { bancos } from '@/config/copy/bancos'

/** Conciliación semiautomática dentro de la pantalla de trabajo. */
const props = defineProps<{ recId: string }>()
const emit = defineEmits<{ saved: [rec: Reconciliation] }>()

const t = bancos.statement
const m = useStatementMatch(props.recId, (rec) => emit('saved', rec))
const headerOptions = computed(() => m.headers.value.map((h) => ({ value: h, label: h })))

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  m.readFile(input.files?.[0])
  input.value = '' // permite volver a subir el mismo archivo
}
</script>

<template>
  <div class="sp panel panel--pad">
    <p class="form-section"><AppIcon name="upload" /> {{ t.title }}</p>
    <p class="sp__intro">{{ t.intro }}</p>

    <div class="sp__input">
      <label class="btn btn--ghost sp__file">
        <AppIcon name="upload" /> {{ t.file }}
        <input type="file" accept=".csv,.txt,text/csv,text/plain" class="visually-hidden" @change="onFile" />
      </label>
      <FormField v-bind="t.paste" for="sp-csv" full>
        <textarea id="sp-csv" v-model="m.csv.value" rows="5" class="mono" spellcheck="false" />
      </FormField>
    </div>

    <div v-if="m.showMapping.value || m.headers.value.length" class="sp__map">
      <button type="button" class="btn btn--ghost btn--sm" @click="m.showMapping.value = !m.showMapping.value">
        <AppIcon :name="m.showMapping.value ? 'chevron-up' : 'chevron-down'" /> {{ t.mapping }}
      </button>
      <template v-if="m.showMapping.value">
        <p class="sp__hint">{{ t.mappingHelp }}</p>
        <div class="form-grid">
          <FormField v-for="k in COLUMN_KEYS" :key="k" :label="t.keys[k]" :for="`sp-map-${k}`">
            <BaseCombobox :id="`sp-map-${k}`" v-model="m.mapping[k]" :options="headerOptions" :empty-label="t.auto" />
          </FormField>
        </div>
      </template>
    </div>

    <p v-if="m.error.value" class="sp__error" role="alert"><AppIcon name="alert-circle" /> {{ m.error.value }}</p>
    <div class="sp__actions">
      <span v-if="m.result.value" class="sp__hint">{{ t.read(m.result.value.totalLines) }}</span>
      <button type="button" class="btn btn--primary" :disabled="m.running.value || !m.csv.value.trim()" @click="m.propose">
        <AppIcon :name="m.running.value ? 'spinner' : 'search'" :spin="m.running.value" /> {{ t.run }}
      </button>
    </div>

    <StatementResults
      v-if="m.result.value"
      :result="m.result.value"
      :accepted="m.accepted.value"
      :running="m.running.value"
      :register="m.registerNote"
      @toggle="m.toggle"
      @all="m.setAll"
      @confirm="m.confirm"
    />
  </div>
</template>

<style scoped lang="scss">
.sp {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__intro,
  &__hint {
    margin: 0;
    font-size: 0.9rem;
    color: $ink-soft;
  }

  &__input {
    @include flex(column, stretch, flex-start, 0.75rem);
  }

  &__file {
    align-self: flex-start;
    cursor: pointer;
  }

  &__map {
    @include flex(column, stretch, flex-start, 0.5rem);

    > .btn {
      align-self: flex-start;
    }
  }

  &__error {
    @include flex(row, center, flex-start, 0.4rem);
    margin: 0;
    color: $danger;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.75rem);
    flex-wrap: wrap;
  }
}
</style>
