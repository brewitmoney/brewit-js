import { createAccount } from '../src/accounts'

test('createAccount returns an account with name and id', () => {
  const acc = createAccount('Alice')
  expect(acc.name).toBe('Alice')
  expect(typeof acc.id).toBe('number')
})