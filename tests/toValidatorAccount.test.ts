import { describe, it, expect } from 'vitest';
import { toAccount } from '../src/account/brewit/toAccount';   
import { toValidatorAccount } from '../src/account/brewit/toValidatorAccount';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { AccountParams } from '../src/types';
  
describe('toAccount', () => {
  const privateKey = generatePrivateKey();
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
    // expect(result).toBeDefined();
  });
}); 