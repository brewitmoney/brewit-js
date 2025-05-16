export function setupAutomation(rule: string) {
  return { rule, active: true }
}

export function getAutomation(id: string) {
  return { id, rule: 'rule1', active: true }
}

export function updateAutomation(id: string, rule: string) {
  return { id, rule, active: true }
}

export function deleteAutomation(id: string) {
  return { id }
}
