<template>
  <v-row>
    <v-col cols="12" md="6">
      <SentenceEditor
        field="full_name"
        label="Full Name"
        :editable="false"
        automation-id="journey-profile-full-name-display"
      />
      <EmailEditor
        field="email"
        label="Email"
        :editable="false"
        automation-id="journey-profile-email-display"
        class="mt-4"
      />
      <div class="mt-4" data-automation-id="journey-profile-goals-display">
        <div class="text-caption text-medium-emphasis mb-1">Goals</div>
        <div v-if="(profile?.goals?.length ?? 0) === 0" class="text-body-2">—</div>
        <ul v-else class="pl-4 mb-0">
          <li
            v-for="(goal, index) in profile?.goals ?? []"
            :key="`goal-${index}`"
            class="text-body-2"
            :data-automation-id="`journey-profile-goal-${index}-display`"
          >
            {{ goal }}
          </li>
        </ul>
      </div>
    </v-col>
    <v-col cols="12" md="6">
      <EnumArrayEditor
        field="interests"
        enums="interests"
        label="Interests"
        :editable="false"
        automation-id="journey-profile-interests-display"
      />
      <SentenceEditor
        field="description"
        label="Notes"
        :editable="false"
        automation-id="journey-profile-notes-display"
        class="mt-4"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  EmailEditor,
  EnumArrayEditor,
  provideDataCardContext,
  SentenceEditor,
} from '@mentor-forge/mentorhub_spa_utils'
import type { Profile } from '@/api/types'

const props = defineProps<{
  profile: Profile
}>()

const profileModel = computed(
  () => props.profile as unknown as Record<string, unknown>
)

provideDataCardContext({
  model: () => profileModel.value,
  onSave: async () => {},
})
</script>
