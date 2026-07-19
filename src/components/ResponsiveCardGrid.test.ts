import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { h, Fragment } from 'vue'
import ResponsiveCardGrid from './ResponsiveCardGrid.vue'

const sfcSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ResponsiveCardGrid.vue'),
  'utf8'
)

describe('ResponsiveCardGrid', () => {
  it('should wrap each slotted card in its own grid item, preserving content', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      slots: {
        default: () => [h('div', { class: 'card' }, 'Alpha'), h('div', { class: 'card' }, 'Beta')],
      },
    })

    const items = wrapper.findAll('.responsive-card-grid__item')
    expect(items).toHaveLength(2)
    expect(wrapper.findAll('.card')).toHaveLength(2)
    expect(items[0].text()).toBe('Alpha')
    expect(items[1].text()).toBe('Beta')
  })

  it('should flatten v-for Fragment slot content into individual grid items', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      slots: {
        default: () => [
          h(Fragment, [
            h('div', { class: 'card', key: 1 }, 'One'),
            h('div', { class: 'card', key: 2 }, 'Two'),
            h('div', { class: 'card', key: 3 }, 'Three'),
          ]),
        ],
      },
    })

    expect(wrapper.findAll('.responsive-card-grid__item')).toHaveLength(3)
    expect(wrapper.findAll('.card').map((c) => c.text())).toEqual(['One', 'Two', 'Three'])
  })

  it('should skip comment/null nodes produced by v-if false branches', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      slots: {
        default: () => [h('div', { class: 'card' }, 'Visible'), null],
      },
    })

    expect(wrapper.findAll('.responsive-card-grid__item')).toHaveLength(1)
    expect(wrapper.find('.card').text()).toBe('Visible')
  })

  it('should render an empty grid when no cards are slotted', () => {
    const wrapper = shallowMount(ResponsiveCardGrid)

    expect(wrapper.find('.responsive-card-grid').exists()).toBe(true)
    expect(wrapper.findAll('.responsive-card-grid__item')).toHaveLength(0)
  })

  it('should apply automationId to the grid root', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      props: { automationId: 'path-list-grid' },
      slots: { default: () => [h('div', 'Card 1')] },
    })

    expect(wrapper.find('.responsive-card-grid').attributes('data-automation-id')).toBe(
      'path-list-grid'
    )
  })

  it('should use generic equal-width stretch classes independent of domain naming', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      slots: { default: () => [h('div', { class: 'card' }, 'Card 1')] },
    })

    expect(wrapper.find('.responsive-card-grid').exists()).toBe(true)
    expect(wrapper.find('.responsive-card-grid__item').exists()).toBe(true)
    expect(wrapper.html().toLowerCase()).not.toContain('path')
  })

  it('should enforce equal-width columns, row stretching, and a maximum of eight columns in CSS', () => {
    expect(sfcSource).toContain('display: grid')
    expect(sfcSource).toContain('align-items: stretch')
    expect(sfcSource).toContain('grid-template-columns: repeat(1, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(2, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(3, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(4, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(5, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(6, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(7, minmax(0, 1fr))')
    expect(sfcSource).toContain('repeat(8, minmax(0, 1fr))')
    // Never more than eight columns.
    expect(sfcSource).not.toMatch(/repeat\(\s*9\s*,/)
    expect(sfcSource).not.toMatch(/repeat\(\s*1[0-9]\s*,/)
  })

  it('should stretch expanded MhCards and keep collapsed cards at intrinsic height', () => {
    const wrapper = shallowMount(ResponsiveCardGrid, {
      slots: {
        default: () => [
          h('div', { class: 'mh-card' }, 'Expanded'),
          h('div', { class: 'mh-card mh-card--collapsed' }, 'Collapsed'),
        ],
      },
    })

    expect(wrapper.findAll('.mh-card')).toHaveLength(2)
    expect(wrapper.find('.mh-card--collapsed').exists()).toBe(true)

    // Expanded: override MhCard intrinsic height only within this grid.
    expect(sfcSource).toContain('.mh-card:not(.mh-card--collapsed)')
    expect(sfcSource).toMatch(/\.mh-card:not\(\.mh-card--collapsed\)[\s\S]*?height:\s*100%/)
    expect(sfcSource).toMatch(/\.mh-card:not\(\.mh-card--collapsed\)[\s\S]*?align-self:\s*stretch/)

    // Collapsed: keep title-bar height; do not stretch to sibling row height.
    expect(sfcSource).toContain('.mh-card--collapsed')
    expect(sfcSource).toMatch(/\.mh-card--collapsed[\s\S]*?align-self:\s*flex-start/)
    expect(sfcSource).toMatch(/\.mh-card--collapsed[\s\S]*?height:\s*auto/)
  })
})
