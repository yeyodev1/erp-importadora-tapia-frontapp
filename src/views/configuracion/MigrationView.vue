<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import MacioCard from '@/components/migration/MacioCard.vue'
import SuppliersCard from '@/components/migration/SuppliersCard.vue'
import SupplierExcelCard from '@/components/migration/SupplierExcelCard.vue'
import DemoCard from '@/components/migration/DemoCard.vue'
import BatchHistory from '@/components/migration/BatchHistory.vue'
import { migration } from '@/config/copy/migration'

/** Migración de datos (solo gerencia): Macio, app de Proveedores, datos de ejemplo e historial con "Quitar". */
const history = ref<InstanceType<typeof BatchHistory> | null>(null)
const refresh = () => history.value?.reload()
</script>

<template>
  <section class="mig">
    <PageHeader :subtitle="migration.intro" />
    <MacioCard @imported="refresh" />
    <div class="mig__cards">
      <SupplierExcelCard @imported="refresh" />
      <SuppliersCard @imported="refresh" />
      <DemoCard />
    </div>
    <BatchHistory ref="history" />
  </section>
</template>

<style scoped lang="scss">
.mig {
  @include flex(column, stretch, flex-start, 1rem);

  &__cards {
    @include flex-cards(320px, 1rem);
    align-items: flex-start;
  }
}
</style>
