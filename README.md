# brewit-js
JavaScript SDK for Humans and Agents - Accounts, Delegations and Automations

## Installation

```bash
# npm
npm install brewit

# pnpm
pnpm install brewit

# yarn
yarn add brewit

# bun
bun install brewit
```

## Usage

### Create a main account

```ts
import { toAccount } from 'brewit';

const account = await toAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: privateKeyToAccount('0x...'),
  type: 'main',
  config: { validator: 'ownable' },
});
```

### Create a delegated account

```ts
import { toAccount } from 'brewit/account';

const account = await toAccount({
  chainId: 8453,
  rpcEndpoint: 'https://mainnet.base.org',
  signer: privateKeyToAccount('0x...'),
  type: 'delegated',
  config: { validator: 'ownable', validatorInitData: '0x...', salt: '0x...' },
});
```


### Send a transaction

```ts
import { createAccountClient } from 'brewit';

const client = createAccountClient(account, bundlerUrl);

const tx = await client.sendTransaction({
  account: account,
  to: '0x...',
  value: '0x...',   
});
```
