import { setupAutomation } from '../src/automation'

test('setupAutomation initializes a rule correctly', () => {
  const auto = setupAutomation('auto-transfer')
  expect(auto.rule).toBe('auto-transfer')
  expect(auto.active).toBe(true)
}) 