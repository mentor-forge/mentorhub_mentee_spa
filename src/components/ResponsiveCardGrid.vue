<script lang="ts">
/**
 * ResponsiveCardGrid — local harvest-ready equal-height responsive card grid.
 *
 * Re-parents each slotted card VNode into a generated grid item so cards keep
 * their identity/keys across re-renders (same pattern as shared CardGrid).
 *
 * Uses CSS Grid (not Vuetify VRow/VCol) so column counts can progress through
 * values that a 12-column system cannot express cleanly (5, 7, 8).
 *
 * Documented column counts (min-width media queries):
 *   1 column  — default (0+)
 *   2 columns — 600px  (Vuetify sm)
 *   3 columns — 960px  (Vuetify md)
 *   4 columns — 1280px (Vuetify lg)
 *   5 columns — 1600px
 *   6 columns — 1920px (Vuetify xl)
 *   7 columns — 2240px
 *   8 columns — 2560px (Vuetify xxl) — maximum; never more than eight
 *
 * Equal-height: expanded cards stretch to the tallest content in the row via
 * grid stretch + scoped overrides of MhCard intrinsic-height rules. Collapsed
 * MhCards (`.mh-card--collapsed`) keep title-bar height and do not stretch.
 *
 * Domain-independent: no journey/API/route knowledge. Suitable for harvest
 * into mentorhub_spa_utils after Paths validation (L107/L108).
 */
import {
  Comment,
  Fragment,
  Text,
  computed,
  defineComponent,
  h,
  useSlots,
  type VNode,
} from 'vue'

function flattenCardNodes(nodes: Array<VNode | null | undefined>): VNode[] {
  const result: VNode[] = []
  for (const node of nodes) {
    if (!node) continue
    if (node.type === Comment) continue
    if (node.type === Text) continue
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenCardNodes(node.children as VNode[]))
      continue
    }
    result.push(node)
  }
  return result
}

export default defineComponent({
  name: 'ResponsiveCardGrid',
  props: {
    automationId: { type: String, default: undefined },
  },
  setup(props) {
    const slots = useSlots()

    const cardNodes = computed(() => flattenCardNodes(slots.default ? slots.default() : []))

    return () =>
      h(
        'div',
        {
          class: 'responsive-card-grid',
          'data-automation-id': props.automationId,
        },
        cardNodes.value.map((node, index) =>
          h(
            'div',
            {
              key: node.key ?? index,
              class: 'responsive-card-grid__item',
            },
            [node]
          )
        )
      )
  },
})
</script>

<style scoped>
.responsive-card-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
  width: 100%;
}

/* Equal-width tracks; max eight columns at the widest breakpoint. */
@media (min-width: 600px) {
  .responsive-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .responsive-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .responsive-card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1600px) {
  .responsive-card-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (min-width: 1920px) {
  .responsive-card-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 2240px) {
  .responsive-card-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

@media (min-width: 2560px) {
  .responsive-card-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

.responsive-card-grid__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* Grid items stretch to the tallest sibling in the row by default. */
}

/*
 * Override MhCard intrinsic-height rules only inside this grid so expanded
 * cards fill the row height. Do not change shared MhCard globally.
 */
.responsive-card-grid__item :deep(.mh-card:not(.mh-card--collapsed)) {
  align-self: stretch;
  height: 100%;
  flex: 1 1 auto;
}

/*
 * Collapsed cards intentionally keep title-bar height and do not stretch to
 * sibling row height (matches shared MhCard / CardGrid collapsed contract).
 */
.responsive-card-grid__item :deep(.mh-card--collapsed) {
  align-self: flex-start;
  height: auto;
  flex: 0 0 auto;
  min-height: 0;
}
</style>
