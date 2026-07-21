<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    data-automation-id="journey-complete-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Complete Resource</v-card-title>
      <v-card-subtitle v-if="resourceName">{{ resourceName }}</v-card-subtitle>
      <v-card-text>
        <div class="text-caption text-medium-emphasis mb-1">Rating</div>
        <v-rating
          :model-value="rating ?? 0"
          length="4"
          color="primary"
          data-automation-id="journey-complete-rating"
          @update:model-value="onRatingUpdate"
        />
        <v-textarea
          v-model="note"
          label="Notes"
          rows="4"
          class="mt-4"
          data-automation-id="journey-complete-note"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          data-automation-id="journey-complete-cancel"
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="rating == null || rating < 1"
          :loading="loading"
          data-automation-id="journey-complete-confirm"
          @click="confirm"
        >
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JourneyCompleteInput } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  resourceId: string
  resourceName?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [input: JourneyCompleteInput]
}>()

const rating = ref<number | null>(null)
const note = ref('')

function onRatingUpdate(value: string | number) {
  rating.value = typeof value === 'number' ? value : Number(value)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      rating.value = null
      note.value = ''
    }
  }
)

function cancel() {
  emit('update:modelValue', false)
}

function confirm() {
  if (rating.value == null || rating.value < 1) {
    return
  }

  const input: JourneyCompleteInput = {
    rating: rating.value,
  }
  if (note.value.trim()) {
    input.note = note.value.trim()
  }
  emit('confirm', input)
}
</script>
