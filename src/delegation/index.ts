import { SmartAccount } from "viem/account-abstraction";
import { buildDisableActionPolicies, buildEnableActionPolicies, buildEnableSmartSession, buildInstallSmartSessionModule, buildRemoveSession } from "../lib/smartaccount/modules/smartsessions"
import { PolicyParams, PolicyType, Token, Transaction,  } from "../types";
import { Address, Hex, PublicClient } from "viem";
import { getSessionValidator } from "../lib/smartaccount/auth";
import { getSpendLimitTokensInfo, getSudoAccessTokensInfo } from "../lib/smartaccount/modules/smartsessions/util";

 export async function createDelegatedAccount(account: SmartAccount, validator: { address: Address; initData: Hex; salt?: Hex}, policyParams: PolicyParams ): Promise<Transaction[]>
 {

  const createDelegatedAccountTx: Transaction[] = [];

  const installSmartSessionModuleTx = await buildInstallSmartSessionModule(account);
  if (installSmartSessionModuleTx) {
    createDelegatedAccountTx.push(installSmartSessionModuleTx);
  }

  const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId()
  createDelegatedAccountTx.push(
    await buildEnableSmartSession(chainId, policyParams, validator)

  );

  return createDelegatedAccountTx;
}

export async function updateDelegatedAccount(account: SmartAccount, policyParams: PolicyParams, validator: { address: Address; initData: Hex; salt?: Hex},) {

  const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId()

  const disableActions = await buildDisableActionPolicies(
    chainId,
    policyParams,
    validator
  );

  const enableActions = await buildEnableActionPolicies(
    chainId,
    policyParams,
    validator
  );

  return [...disableActions, ...enableActions];
  }

  export async function removeDelegatedAccount(account: SmartAccount, validator: { address: Address; initData: Hex; salt?: Hex},) {

    const chainId = account.client.chain?.id ?? await (account.client as PublicClient).getChainId()
    const disableActions = await buildRemoveSession(
      validator,
      chainId
    );

    return disableActions;
  }


  export async function getDelegatedAccount(client: PublicClient, tokens: Token[], account: Address, validator: { address: Address; initData: Hex; salt?: Hex}, policy: PolicyType) {
    
    let delegatedAccountInfo: {
      address: Address;
      permissions: {
        swap: boolean;
        spend: boolean;
      };
    }[] | {
      address: Address;
      limit: string;
      spent: string;
      balance: bigint;
    }[] = [];
    if(policy === 'spendlimit') {
      delegatedAccountInfo = await getSpendLimitTokensInfo(
        client,
        tokens,
        account,
        validator
      );
    } else if(policy === 'sudo') {
      delegatedAccountInfo = await getSudoAccessTokensInfo(
        client,
        tokens,
        account,
        validator
      );
    }

    return delegatedAccountInfo;
  }