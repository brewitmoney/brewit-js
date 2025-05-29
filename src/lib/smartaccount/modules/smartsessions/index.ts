import {
  Address,
  Hex,
  parseUnits,
  PrivateKeyAccount,
  PublicClient,
  toBytes,
  toFunctionSelector,
  toHex,
} from 'viem';
import { buildInstallModule, isInstalled } from '..';
import {
  ActionData,
  EnableSessionData,
  SmartSessionMode,
  SmartSessionModeType,
} from './types';
import {
  encodeValidationData,
  getActionId,
  getDisableActionPoliciesAction,
  getEnableActionPoliciesAction,
  getEnableSessionsAction,
  getRemoveSessionAction,
  getSpendingLimitsPolicy,
  getSudoPolicy,
  getPermissionId,
  Session,
} from '@rhinestone/module-sdk';
import { OWNABLE_VALIDATOR_ADDRESS } from '../../../../constants';
import { privateKeyToAccount } from 'viem/accounts';
import { getModuleByChainId } from '../address';
import { Transaction } from '../../../../types';

export const getSessionValidatorAccount = (
  sessionPKey: Hex
): PrivateKeyAccount => {
  const validator = privateKeyToAccount(sessionPKey);
  return validator;
};

export function getSessionValidatorDetails(validatorAccount: Hex) {
  return {
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData: encodeValidationData({
      threshold: 1,
      owners: [validatorAccount],
    }),
  };
}

export const buildInstallSmartSessionModule = async (
  chainId: number,
  safeAccount: Address,
  client: PublicClient
): Promise<Transaction | null> => {
  const { smartSession } = getModuleByChainId(chainId);

  const isModuleInstalled = await isInstalled(
    chainId,
    client,
    safeAccount,
    smartSession,
    'validator'
  );

  if (!isModuleInstalled) {
    return await buildInstallModule(
      chainId,
      client,
      safeAccount,
      smartSession,
      'validator',
      '0x'
    );
  }
  return null;
};

export const buildUseSmartSession = async (
  chainId: number,
  validator: {
    address: Address;
    initData: Hex;
    salt?: Hex;
  }
): Promise<{
  mode: SmartSessionModeType;
  permissionId: Hex;
  signature: Hex;
  enableSessionData?: EnableSessionData;
}> => {
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const sessionDetails = {
    permissionId: getPermissionId({ session }),
    mode: SmartSessionMode.USE,
    signature: '0x' as Hex,
  };

  return sessionDetails;
};

type SpendLimitParams = {
  policy: 'spendlimit';
  tokenLimits: { token: Address; amount: bigint }[];
  tokenAccess?: never;
};

type SudoParams = {
  policy: 'sudo';
  tokenAccess: {
    address: Address;
    isTransferEnabled: boolean;
    isSwapEnabled: boolean;
  }[];
  tokenLimits?: never;
};

export const buildEnableSmartSession = async (
  chainId: number,
  policyParams: SpendLimitParams | SudoParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction> => {
  const { spendLimitPolicy } = getModuleByChainId(chainId);

  let actions: ActionData[] = [];
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
  if (policyParams.policy === 'spendlimit') {
    actions = await Promise.all(
      policyParams.tokenLimits.map(async ({ token, amount }) => {
        const spendingLimitsPolicy = getSpendingLimitsPolicy([
          {
            token: token,
            limit: amount,
          },
        ]);

        return {
          actionTarget: token, // an address as the target of the session execution
          actionTargetSelector: transferSelector, // function selector to be used in the execution
          actionPolicies: [
            {
              policy: spendLimitPolicy,
              initData: spendingLimitsPolicy.initData,
            },
          ],
        };
      })
    );
  } else if (policyParams.policy === 'sudo') {
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

    const allowanceSelector = toFunctionSelector({
      name: 'exec',
      type: 'function',
      inputs: [
        { name: 'operator', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'target', type: 'address' },
        { name: 'data', type: 'bytes' },
      ],
      outputs: [{ type: 'bytes', name: 'result' }],
      stateMutability: 'payable',
    });

    actions = [
      {
        actionTarget: '0x0000000000001ff3684f28c67538d4d072c22734',
        actionTargetSelector: allowanceSelector,
        actionPolicies: [getSudoPolicy()],
      },
    ];

    const tokenActions = policyParams.tokenAccess.map((tokenAccess) => {
      const tokenActions = [];
      if (tokenAccess.isSwapEnabled) {
        tokenActions.push({
          actionTarget: tokenAccess.address,
          actionTargetSelector: approveSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
      if (tokenAccess.isTransferEnabled) {
        tokenActions.push({
          actionTarget: tokenAccess.address,
          actionTargetSelector: transferSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
      return tokenActions;
    });

    actions = [...actions, ...tokenActions.flat()];
  }
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions,
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const action = getEnableSessionsAction({ sessions: [session] });

  return {
    to: action.to,
    value: BigInt(0),
    data: action.data,
  };
};

export const buildRemoveSession = async (
  validator: {
    address: Address;
    initData: Hex;
    salt?: Hex;
  },
  chainId: number
): Promise<Transaction> => {
  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

  const action = getRemoveSessionAction({
    permissionId: getPermissionId({ session }),
  });

  return {
    to: action.to,
    value: BigInt(0),
    data: action.data,
  };
};

type UpdateActionParams = {
  type: 'spendlimit' | 'sudo';
  updates: {
    address: Address;
    spendlimit?: {
      limit: number;
    };
    permissions?: {
      swap?: boolean;
      spend?: boolean;
    };
  }[];
};

export const buildDisableActionPolicies = async (
  chainId: number,
  disableActionParams: UpdateActionParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction[]> => {
  const { spendLimitPolicy } = getModuleByChainId(chainId);

  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

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

  let actions: Transaction[] = [];
  if (disableActionParams.type === 'spendlimit') {
    actions = await Promise.all(
      disableActionParams.updates
        .filter((update) => update.spendlimit?.limit == 0)
        .map(async (update) => {
          const actionId = await getActionId({
            target: update.address,
            selector: transferSelector,
          });
          const action = getDisableActionPoliciesAction({
            permissionId: getPermissionId({ session }),
            actionId: actionId,
            policies: [spendLimitPolicy],
          });

          return {
            to: action.to,
            value: BigInt(0),
            data: action.data,
          };
        })
    );
  } else if (disableActionParams.type === 'sudo') {
    actions = await Promise.all(
      disableActionParams.updates
        .filter(
          (update) =>
            update.permissions?.spend === false ||
            update.permissions?.swap === false
        )
        .map(async (update) => {
          const removeActions = [];
          if (update.permissions?.spend === false) {
            const action = getDisableActionPoliciesAction({
              permissionId: getPermissionId({ session }),
              actionId: await getActionId({
                target: update.address,
                selector: transferSelector,
              }),
              policies: [getSudoPolicy().policy],
            });
            removeActions.push({
              to: action.to,
              value: BigInt(0),
              data: action.data,
            });
          }
          if (update.permissions?.swap === false) {
            const action = getDisableActionPoliciesAction({
              permissionId: getPermissionId({ session }),
              actionId: await getActionId({
                target: update.address,
                selector: approveSelector,
              }),
              policies: [getSudoPolicy().policy],
            });
            removeActions.push({
              to: action.to,
              value: BigInt(0),
              data: action.data,
            });
          }

          return removeActions;
        })
    ).then((arrays) => arrays.flat());
  }

  return actions;
};

export const buildEnableActionPolicies = async (
  chainId: number,
  enableActionParams: UpdateActionParams,
  validator: { address: Address; initData: Hex; salt?: Hex }
): Promise<Transaction[]> => {
  const { spendLimitPolicy } = getModuleByChainId(chainId);

  const session: Session = {
    sessionValidator: validator.address,
    sessionValidatorInitData: validator.initData,
    salt: validator.salt || toHex(toBytes('1', { size: 32 })),
    userOpPolicies: [getSudoPolicy()],
    erc7739Policies: {
      allowedERC7739Content: [],
      erc1271Policies: [],
    },
    actions: [],
    permitERC4337Paymaster: true,
    chainId: BigInt(chainId),
  };

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

  let actions: Transaction[] = [];
  if (enableActionParams.type === 'spendlimit') {
    actions = await Promise.all(
      enableActionParams.updates
        .filter(
          (update) => update.spendlimit?.limit && update.spendlimit.limit > 0
        )
        .map(async (update) => {
          const spendingLimitsPolicy = getSpendingLimitsPolicy([
            {
              token: update.address,
              limit: BigInt(update.spendlimit!.limit),
            },
          ]);

          const action = getEnableActionPoliciesAction({
            permissionId: getPermissionId({ session }),
            actionPolicies: [
              {
                actionTarget: update.address,
                actionTargetSelector: transferSelector,
                actionPolicies: [
                  {
                    policy: spendLimitPolicy,
                    initData: spendingLimitsPolicy.initData,
                  },
                ],
              },
            ],
          });

          return {
            to: action.to,
            value: BigInt(0),
            data: action.data,
          };
        })
    );
  } else if (enableActionParams.type === 'sudo') {
    const actionPolicies = [];

    for (const update of enableActionParams.updates) {
      if (update.permissions?.spend === true) {
        actionPolicies.push({
          actionTarget: update.address,
          actionTargetSelector: transferSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }

      if (update.permissions?.swap === true) {
        actionPolicies.push({
          actionTarget: update.address,
          actionTargetSelector: approveSelector,
          actionPolicies: [getSudoPolicy()],
        });
      }
    }

    if (actionPolicies.length > 0) {
      const action = getEnableActionPoliciesAction({
        permissionId: getPermissionId({ session }),
        actionPolicies,
      });

      actions.push({
        to: action.to,
        value: BigInt(0),
        data: action.data,
      });
    }
  }

  return actions;
};
