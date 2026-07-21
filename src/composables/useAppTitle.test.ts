import { describe, it, expect, beforeEach } from 'vitest'
import { useAppTitle } from './useAppTitle'

describe('useAppTitle', () => {
  beforeEach(() => {
    const { resetAppBarTitle } = useAppTitle()
    resetAppBarTitle()
  })

  it('defaults to Mentee', () => {
    const { appBarTitle } = useAppTitle()
    expect(appBarTitle.value).toBe('Mentee')
    expect(document.title).toBe('Mentee')
  })

  it('sets full_name:Mentee when profile name is provided', () => {
    const { setAppBarTitle, appBarTitle } = useAppTitle()
    setAppBarTitle('Jane Mentee')
    expect(appBarTitle.value).toBe('Jane Mentee:Mentee')
    expect(document.title).toBe('Jane Mentee:Mentee')
  })

  it('resets to Mentee when profile name is cleared', () => {
    const { setAppBarTitle, resetAppBarTitle, appBarTitle } = useAppTitle()
    setAppBarTitle('Jane Mentee')
    resetAppBarTitle()
    expect(appBarTitle.value).toBe('Mentee')
    expect(document.title).toBe('Mentee')
  })
})
