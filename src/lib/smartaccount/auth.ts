
import {
  generatePrivateKey,
  LocalAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import { encodeValidationData } from '@rhinestone/module-sdk';
import {
  OWNABLE_VALIDATOR_ADDRESS,
  WEBAUTHN_VALIDATOR_ADDRESS,
} from '../../constants';
import { Address, Hex } from 'viem';
import { DelegatedAccountConfig, Subaccount, ValidatorType } from '../../types';
import { WEBAUTHN_SESSION_VALIDATOR_ADDRESS } from '../../constants';
import { KernelValidator } from '../../types/kernel';

export const generateRandomPrivateKey = (): Hex => {
  return generatePrivateKey(); // Convert to hex string and prepend '0x'
};



export function getPKeySessionValidator(validator: LocalAccount): {
  validator: ValidatorType;
  address: Hex;
  initData: Hex;
  context: Hex;
} {
  return {
    validator: 'ownable',
    address: OWNABLE_VALIDATOR_ADDRESS,
    context: encodeValidationData({
      threshold: 1,
      owners: [validator.address],
    }),
    initData: encodeValidationData({
      threshold: 1,
      owners: [validator.address],
    }),
  };
}

export async function getPassKeySessionValidator(
  validator: KernelValidator
): Promise<{ validator: string; address: Hex; initData: Hex }> {
  // Replace with proper passkey session validator
  return {
    validator: 'passkey',
    address: WEBAUTHN_SESSION_VALIDATOR_ADDRESS as Hex,
    initData: (await validator.getEnableData()) as Hex,
  };
}

export const getPassKeyValidator = async (validator: any) => {
  return {
    address: WEBAUTHN_VALIDATOR_ADDRESS,
    context: await validator.getEnableData(),
  };
};

export function getSessionValidator(subaccount: DelegatedAccountConfig): {
  validator: ValidatorType;
  address: Hex;
  initData: Hex;
  salt: Hex;
} {
  return {
    validator: subaccount.validator,
    address:
      subaccount.validator == 'ownable'
        ? OWNABLE_VALIDATOR_ADDRESS
        : (WEBAUTHN_SESSION_VALIDATOR_ADDRESS as Hex),
    initData: subaccount.validatorInitData,
    salt: subaccount.salt,
  };
}


export function formatSubAccounts(
  account: Address,
  initData: Hex,
  subaccounts: Subaccount[]
): { owned: Subaccount[]; created: Subaccount[] } {
  if (!subaccounts?.length) {
    return { owned: [], created: [] };
  }

  const normalizedAccount = account.toLowerCase();
  const normalizedInitData = initData.toLowerCase();

  return {
    created: subaccounts.filter(
      (subaccount) =>
        subaccount.accountAddress.toLowerCase() === normalizedAccount
    ),
    owned: subaccounts.filter(
      (subaccount) =>
        subaccount.validatorInitData.toLowerCase() === normalizedInitData
    ),
  };
}
