export function createAccount(name: string) {
    return { id: Date.now(), name }
  }

export function getAccount(id: number) {
    return { id, name: 'John Doe' }
  }
  
  
  export function updateAccount(id: number, name: string) {
    return { id, name }
  }
  
  export function deleteAccount(id: number) {
    return { id }
  }