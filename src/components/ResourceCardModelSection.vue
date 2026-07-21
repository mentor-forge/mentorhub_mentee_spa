<script setup lang="ts">
import { provideDataCardContext, type DataCardModel } from '@mentor-forge/mentorhub_spa_utils'

const props = defineProps<{
  model: DataCardModel
}>()

provideDataCardContext({
  model: () => props.model,
  onSave: async () => {},
})
</script>

<template>
  <slot />
</template>
