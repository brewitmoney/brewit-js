import { Address, Hex } from 'viem';

export interface Transaction {
  to: Hex;
  value: bigint;
  data: Hex;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  address: Address;
  decimals: number;
  iconUrl: string;
  tokenId?: string;
  type?: string;
  price?: number;
  totalSupply?: number;
  priceChange1d?: number;
  pricePercentChange1d?: number;
}

export interface Token extends TokenInfo {
  balance?: string;
  usdValue?: number;
  spendlimit?: any;
  permissions?: {
    spend: boolean;
    swap: boolean;
  };
  chain?: {
    id: string;
    chainId?: number;
    name: string;
  };
  quantity?: {
    int: string;
    decimals: number;
    float: number;
    numeric: string;
  };
  chains?: {
    chain: {
      id: string;
      chainId?: number;
      name: string;
    };
    balance: string;
    usdValue: number;
    address: Address;
  }[];
}
export type AccountType = 'main' | 'delegated';
export type BaseAccountParams = {
  chainId: number;
  rpcEndpoint: string;
  signer: any;
  safeAddress?: Hex;
  type?: AccountType;
};

export type MainAccountConfig = {
  validator: ValidatorType;
};

export type DelegatedAccountConfig = {
  validator: ValidatorType;
  salt: Hex;
  validatorInitData: Hex;
};



export type DelegatedAccountParams = BaseAccountParams & {
  config: DelegatedAccountConfig;
};

export type MainAccountParams = BaseAccountParams & {
  config: MainAccountConfig;
};

export type AccountParams = MainAccountParams | DelegatedAccountParams;

// Runtime type guard
export const isDelegatedConfig = (config: MainAccountConfig | DelegatedAccountConfig): config is DelegatedAccountConfig => {
  return 'salt' in config && 'validatorInitData' in config;
};

export type ValidatorType = 'passkey' | 'ownable';

export type PolicyType = 'spendlimit' | 'sudo';

// Define an interface for the account info
export interface AuthInfo {
  authType: 'normal' | 'validator' | 'session';
  validator?: ValidatorType;
  authData: any; // Replace 'any' with a more specific type if known
}

export interface Subaccount {
  name: string;
  validator: ValidatorType;
  policy: PolicyType;
  validatorInitData: Hex;
  salt: Hex;
  accountAddress: Hex;
  tag: string;
  chainid: number;
  created_at?: string;
}

export interface AccountInfo {
  authInfo?: AuthInfo;
  subaccounts?: Subaccount[];
  address?: Hex;
  userInfo?: UserInfo;
}

export interface UserInfo {
  name: string;
  email: string;
  avatar: string;
  bio?: string;
}
