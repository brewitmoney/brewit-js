import {
  Address,
  Client,
  erc20Abi,
  formatUnits,
  Hex,
  PublicClient,
  toFunctionSelector,
  zeroAddress,
  Abi,
} from 'viem';
import { computeConfigId, getActionId } from './smartsessions';
import { installSmartSessionsAbi, abi as smartSessionsAbi } from './abi';
import { buildUseSmartSession } from '.';
import SpendingLimitPolicy from '../abis/SpendingLimitPolicy.json';
import { getModuleByChainId } from '../address';
import { SMART_SESSIONS_ADDRESS, SPEND_LIMIT_POLICY_ADDRESS } from '../../../../constants';
import { Token } from '../../../../types';
import { Subaccount } from '../../../../types';
import { getSessionValidator } from '../../auth';
import { getPublicClient } from '../../../../utils/network';

const getSpendPolicy = async (
  client: PublicClient,
  configId: string,
  account: Address,
  token: Address
): Promise<any> => {
  const spendPolicy = await client.readContract({
    address: SPEND_LIMIT_POLICY_ADDRESS,
    abi: SpendingLimitPolicy.abi,
    functionName: 'getPolicyData',
    args: [configId, SMART_SESSIONS_ADDRESS, token, account],
  });

  return spendPolicy;
};
export async function getSpendableTokenInfo(
  client: PublicClient,
  tokenAddress: Hex,
  account: Hex,
  validator: { address: Address; initData: Hex; salt?: Hex }
) {
  // Ethereum provider (you can use Infura or any other provider)

  if (!client.chain) {
    throw new Error('Chain not found');
  }
  // Get token balance
  const [balance, decimals] = await Promise.all([
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account as `0x${string}`],
    }),
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'decimals',
    }),
  ]);

  const execCallSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });
  const actionId = getActionId({
    target: tokenAddress,
    selector: execCallSelector,
  });

  const smartSession = await buildUseSmartSession(client.chain.id, validator);
  const spendPolicy = await getSpendPolicy(
    client,
    computeConfigId(smartSession.permissionId, actionId, account),
    account,
    tokenAddress
  );
  // spendPolicy is an array [spendingLimit, alreadySpent]
  const [spendingLimit, alreadySpent] = spendPolicy;

  return {
    limit: formatUnits(spendingLimit, decimals),
    spent: formatUnits(alreadySpent, decimals),
    balance: formatUnits(BigInt(spendingLimit - alreadySpent), decimals),
  };
}

// Previous implementation: getSpendableTokensInfo
export async function getSpendLimitTokensInfo(
  client: PublicClient,
  tokens: Token[],
  account: Hex,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<{
  address: Address;
  limit: string;
  spent: string;
  balance: bigint;
}[]> {
  if (!client.chain) {
    throw new Error('Chain not found');
  }
  const execCallSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const useSmartSession = await buildUseSmartSession(
    client.chain.id,
    validator
  );

  const spendPolicy = await client.multicall({
    contracts: tokens.map((token: Token) => {
      const actionId = getActionId({
        target: token.address,
        selector: execCallSelector,
      });
      return {
        address: SPEND_LIMIT_POLICY_ADDRESS as Address,
        abi: SpendingLimitPolicy.abi as Abi,
        functionName: 'getPolicyData',
        args: [
          computeConfigId(useSmartSession.permissionId, actionId, account),
          SMART_SESSIONS_ADDRESS,
          token.address,
          account,
        ],
      };
    }),
    batchSize: 0, // Need to batch if fails
  });

  const policiesEnabled = await checkPolicyEnabled(
    client,
    tokens,
    account,
    validator
  );

  const parsedSpendPolicies = spendPolicy.map((policy: any, idx: number) => {
    // Handle failed or undefined results

    if (
      !policy ||
      policy.status === 'failure' ||
      !policy.result ||
      !policiesEnabled[idx].isSudoEnabled
    ) {
      return {
        address: tokens[idx].address,
        limit: '0',
        spent: '0',
        balance: BigInt(0),
      };
    }

    return {
      address: tokens[idx].address,
      limit: formatUnits(policy.result[0], tokens[idx].decimals),
      spent: formatUnits(policy.result[1], tokens[idx].decimals),
      balance: BigInt(policy.result[0] - policy.result[1]),
    };
  });

  return parsedSpendPolicies;
}

export async function checkPolicyEnabled(
  client: PublicClient,
  tokens: Token[],
  account: Hex,
  validator: { address: Address; initData: Hex; salt?: Hex }
) {
  if (!client.chain) {
    throw new Error('Chain not found');
  }
  const useSmartSession = await buildUseSmartSession(
    client.chain.id,
    validator
  );

  const transferSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const isSudoEnabled = await client.multicall({
    contracts: tokens.map((token: Token) => {
      const actionId = getActionId({
        target: token.address,
        selector: transferSelector,
      });

      return {
        address: SMART_SESSIONS_ADDRESS as Hex,
        abi: smartSessionsAbi,
        functionName: 'isActionPolicyEnabled',
        args: [
          account,
          useSmartSession.permissionId,
          actionId,
          SPEND_LIMIT_POLICY_ADDRESS,
        ],
      };
    }),
    batchSize: 0, // Need to batch if fails
  });

  const parsedIsSudoEnabled = isSudoEnabled.map((result: any, idx: number) => {
    if (result.status === 'failure' || !result.result) {
      return {
        address: tokens[idx].address,
        isSudoEnabled: false,
      };
    }
    return {
      address: tokens[idx].address,
      isSudoEnabled: result.result,
    };
  });

  return parsedIsSudoEnabled;
}

// Previous implementation: checkSudoActions
export async function getSudoAccessTokensInfo(
  client: PublicClient,
  tokens: Token[],
  account: Hex,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<{
  address: Address;
  permissions: {
    swap: boolean;
    spend: boolean;
  };
}[]> {
  if (!client.chain) {
    throw new Error('Chain not found');
  }
  const useSmartSession = await buildUseSmartSession(
    client.chain.id,
    validator
  );

  const approveSelector = toFunctionSelector({
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const transferSelector = toFunctionSelector({
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'view',
  });

  const enabledActions = await client.multicall({
    contracts: tokens.map((token: Token) => {
      const actionId = getActionId({
        target: token.address,
        selector: approveSelector,
      });

      return {
        address: SMART_SESSIONS_ADDRESS as Hex,
        abi: smartSessionsAbi,
        functionName: 'getEnabledActions',
        args: [account, useSmartSession.permissionId],
      };
    }),
    batchSize: 0, // Need to batch if fails
  });

  const parsedEnabledActions = enabledActions.map(
    (result: any, idx: number) => {
      if (result.status === 'failure' || !result.result) {
        return {
          address: tokens[idx].address as Address,
          permissions: {
            swap: false,
            spend: false,
          },
        };
      }
      const approveActionId = getActionId({
        target: tokens[idx].address,
        selector: approveSelector,
      });
      const transferActionId = getActionId({
        target: tokens[idx].address,
        selector: transferSelector,
      });
      return {
        address: tokens[idx].address as Address,
        permissions: {
          swap: result.result.includes(approveActionId),
          spend: result.result.includes(transferActionId),
        },
      };
    }
  );

  return parsedEnabledActions;
}


// Previous implementation: getSpendableTokensList
export async function getDelegatedTokensList(
  client: PublicClient,
  accountTokens: Token[],
  subAccountInfo: Subaccount,
  account: Address
) {
  const subAccountTokens = accountTokens.filter(
    (token: Token) => token.address !== zeroAddress
  );

  let subAccountTokensBalance: any;
  let updatedAccountTokens: Token[] = [];
  if (subAccountInfo?.policy === 'spendlimit') {
    const sessionValidator = getSessionValidator(subAccountInfo);

    subAccountTokensBalance = await getSpendLimitTokensInfo(
      client,
      subAccountTokens,
      account,
      sessionValidator
    );

    updatedAccountTokens = subAccountTokens.map(
      (token: Token, index: number) => ({
        ...token,
        balance:
          BigInt(subAccountTokensBalance[index].balance) <
          BigInt(token.quantity?.int || '0')
            ? formatUnits(
                subAccountTokensBalance[index].balance,
                token.decimals
              )
            : token.balance,
        usdValue:
          parseFloat(
            formatUnits(subAccountTokensBalance[index].balance, token.decimals)
          ) * (token.price ?? 0),
      })
    );
  }

  let sudoActions: any;
  if (subAccountInfo?.policy === 'sudo') {
    const sessionValidator = getSessionValidator(subAccountInfo);
    sudoActions = await getSudoAccessTokensInfo(
      client,
      subAccountTokens,
      account,
      sessionValidator
    );
    updatedAccountTokens = subAccountTokens.map(
      (token: Token, index: number) => ({
        ...token,
        balance:
          sudoActions[index].permissions?.spend ||
          sudoActions[index].permissions?.swap
            ? token.balance
            : '0',
      })
    );
  }

  updatedAccountTokens = updatedAccountTokens.filter(
    (token: Token) => token.balance !== '0'
  );

  return updatedAccountTokens;
}
