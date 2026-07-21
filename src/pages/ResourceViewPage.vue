<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="resource-view-heading">View Resource</h1>
      </v-col>
    </v-row>

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
