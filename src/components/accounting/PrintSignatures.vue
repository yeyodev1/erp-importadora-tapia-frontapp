<script setup lang="ts">
import { accountingScreens } from '@/config/copy/accountingScreens'

/**
 * Firmas al pie del comprobante impreso (ELABORADO POR, REVISADO, RECIBIDO,
 * CONTADOR, GERENTE), como el asiento que imprime hoy el sistema anterior.
 * Va fuera de #app con la clase print-sheet: solo aparece en la hoja impresa,
 * debajo de la tabla de ThePrintSheet, mientras la pantalla esté abierta.
 */
withDefaults(defineProps<{ names?: string[] }>(), { names: () => accountingScreens.signatures })
</script>

<template>
  <Teleport to="body">
    <div class="print-sheet ps-sign" aria-hidden="true">
      <div v-for="n in names" :key="n" class="ps-sign__box">
        <span class="ps-sign__line" />
        <span>{{ n }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
// Sin scoped: vive fuera de #app, igual que ThePrintSheet.
.ps-sign {
  margin-top: 36pt;
  font-family: $font-principal;
  color: #000;

  @media print {
    body.is-printing &.print-sheet {
      display: flex;
      justify-content: space-between;
      gap: 12pt;
    }
  }

  &__box {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 0;
    gap: 3pt;
    font-size: 7.5pt;
    font-weight: 600;
  }

  &__line {
    width: 100%;
    border-top: 0.75pt solid #000;
  }
}
</style>
