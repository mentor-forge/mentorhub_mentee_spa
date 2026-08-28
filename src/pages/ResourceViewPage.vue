<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <ResourceViewCard :resource-id="resourceId">
          <template #actions>
            <v-btn
              :href="browseResourcesHref"
              variant="text"
              data-automation-id="resource-view-browse-resources-link"
            >
              Browse Resources
            </v-btn>
          </template>
        </ResourceViewCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { buildJourneyUrl } from '@mentor-forge/mentorhub_spa_utils'
import ResourceViewCard from '@/components/ResourceViewCard.vue'

const routeLocation = useRoute()

const resourceId = computed(() => routeLocation.params.id as string)
const browseResourcesHref = buildJourneyUrl('discovery', 'resources')
</script>
