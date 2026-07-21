import { describe, it, expect } from 'vitest'
import { levelCardTitle } from './levelCardTitle'

describe('levelCardTitle', () => {
  it('returns level:name when name is provided', () => {
    expect(levelCardTitle('Module', 'Foundations')).toBe('Module:Foundations')
  })

  it('returns level only when name is missing', () => {
    expect(levelCardTitle('Topic')).toBe('Topic')
    expect(levelCardTitle('Resource', undefined)).toBe('Resource')
  })
})
