import { describe, it, expect } from 'vitest'

describe('test env', () => {
  it('jsdom 提供 localStorage', () => {
    localStorage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
  })
})
