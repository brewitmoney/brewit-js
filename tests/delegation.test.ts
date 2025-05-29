import { expect } from 'vitest'
import { test } from 'vitest'
import { createDelegatedAccount } from '../src/delegation'

test('createDelegatedAccount returns delegate with proper format', () => {
  const delegate = createDelegatedAccount(42)
  expect(delegate.id).toBe('delegate-42')
  expect(Array.isArray(delegate.permissions)).toBe(true)
})