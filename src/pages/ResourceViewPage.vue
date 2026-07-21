<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <ResourceViewCard :resource-id="resourceId">
          <template #actions>
            <v-btn
              @click="router.push('/resources')"
              variant="text"
              data-automation-id="resource-view-back-to-list-button"
            >
              Back to List
            </v-btn>
          </template>
        </ResourceViewCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResourceViewCard from '@/components/ResourceViewCard.vue'

const routeLocation = useRoute()
const router = useRouter()

const resourceId = computed(() => routeLocation.params.id as string)
</script>
