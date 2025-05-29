import {
  Hex,
  PublicClient,
  http,
  Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { entryPoint07Address } from 'viem/account-abstraction';

import { toSafeSmartAccount, ToSafeSmartAccountReturnType } from 'permissionless/accounts';
import {
  DEFAULT_SAFE_SIGNER_ADDRESS,
  ERC7579_LAUNCHPAD_ADDRESS,
  RHINESTONE_ATTESTER_ADDRESS,
  SAFE_4337_MODULE_ADDRESS,
  SAFE_SINGLETON_ADDRESS,
  BREWIT_ATTESTER_ADDRESS,
} from '../../constants';


interface SmartAccountClientParams {
  client: PublicClient;
  signer?: any;
  nonceKey?: bigint;
  address?: Hex;
  signUserOperation?: any;
  getDummySignature?: any;
  validators?: { address: Address; context: Hex }[];
  executors?: { address: Address; context: Hex }[];

  validatorAddress?: Address;
  factoryAddress?: Address;
}

export const getSmartAccount = async ({
  client,
  nonceKey,
  signer,
  address,
  signUserOperation,
  getDummySignature,
  validators,
  executors,
}: SmartAccountClientParams): Promise<ToSafeSmartAccountReturnType<'0.7'>> => {

  // Create a dummy private key signer
  const dummyPrivateKey = generatePrivateKey(); // Generate a dummy private key
  const dummySigner = privateKeyToAccount(dummyPrivateKey); // Create an account from the private key
  dummySigner.address = DEFAULT_SAFE_SIGNER_ADDRESS;

  // Use the dummy signer if no signer is provided
  signer = signer || dummySigner;

  const account = await toSafeSmartAccount({
    client: client,
    owners: [signer],
    address: address,
    version: '1.4.1',
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
    validators,
    executors,
    nonceKey,
    safe4337ModuleAddress: SAFE_4337_MODULE_ADDRESS,
    erc7579LaunchpadAddress: ERC7579_LAUNCHPAD_ADDRESS,
    safeSingletonAddress: SAFE_SINGLETON_ADDRESS,

    attesters: [
      RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
      BREWIT_ATTESTER_ADDRESS, // Brewit Attester - only for test modules
      // MOCK_ATTESTER_ADDRESS, // Mock Attester - do not use in production
    ],
    attestersThreshold: 1,
  });
  

  account.signUserOperation = signUserOperation ?? account.signUserOperation;
  account.getStubSignature = getDummySignature ?? account.getStubSignature;

  return account;

};

