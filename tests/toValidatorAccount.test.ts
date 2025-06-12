import { describe, it, expect } from 'vitest';
import { toAccount, toValidatorAccount, buildInstallModule, buildUninstallModule } from '../src/account';
import { privateKeyToAccount, generatePrivateKey, Address } from 'viem/accounts';
import { AccountParams } from '../src/types';
import { createDelegatedAccount } from '../src/delegation';
import { PolicyParams } from '../src/types';
import { Hex } from 'viem';
  
describe('toAccount', () => {
  const privateKey = generatePrivateKey();
  console.log(privateKey)
  const signer = privateKeyToAccount(privateKey);
  const mockParams: AccountParams = {
    chainId: 84530,
    rpcEndpoint: 'http://localhost:8545',    
    signer: signer as any,
    config: { validator: 'ownable' },
    type: 'main'
  };

  it('should create a main account without config', async () => {
    const result = await toAccount(mockParams);
    console.log(result)
    // expect(result).toBeDefined();
  });

  it('should create a validator account', async () => {
    const result = await toValidatorAccount(mockParams);
    console.log(result.client.transport);
    // expect(result).toBeDefined();
  });

  it('should install a module', async () => {

    const account = await toAccount(mockParams);

    const result = await buildInstallModule(account, '0x0000000000000000000000000000000000000000', 'validator', '0x');
    console.log(result);
    // expect(result).toBeDefined();
  });




}); 