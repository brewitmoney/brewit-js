 export function createDelegatedAccount(ownerId: number) {
    return { id: `delegate-${ownerId}`, permissions: [] }
  }

export function getDelegatedAccount(id: string) {
    return { id, permissions: ['delegate'] }
  }

export function updateDelegatedAccount(id: string, permissions: string[]) {
    return { id, permissions }
  } 