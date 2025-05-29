import { getModule, installModule, isModuleInstalled, SENTINEL_ADDRESS } from "@rhinestone/module-sdk";

import { getAccount, getClient, ModuleType } from "@rhinestone/module-sdk";
import { Address, encodeAbiParameters, encodeFunctionData, getAddress, Hex, PublicClient } from "viem";
import { Transaction } from "../../../types";
import {SMART_SESSIONS_ADDRESS } from "../../../constants";


function parseModuleTypeId(type: ModuleType): bigint {
    switch (type) {
      case 'validator':
        return BigInt(1);
      case 'executor':
        return BigInt(2);
      case 'fallback':
        return BigInt(3);
      case 'hook':
        return BigInt(4);
      default:
        throw new Error('Invalid module type');
    }
  }


export const buildInstallModule = async (
    chainId: number,
    client: PublicClient,
    safeAddress: Address,
    address: Address,
    type: ModuleType,
    initData: Hex
  ): Promise<Transaction> => {
    // const client = getClient({
    //   rpcUrl: NetworkUtil.getNetworkByChainId(chainId)?.url!,
    // });
  
    // Create the account object
    const account = getAccount({
      address: safeAddress, 
      type: 'safe',
    });
  
    const accountModule = getModule({
      module: address,
      initData: initData,
      type: type,
    });
  
    const executions = await installModule({
      client,
      account,
      module: accountModule,
    });
  
    return {
      to: executions[0].target,
      value: BigInt(executions[0].value.toString()),
      data: executions[0].callData,
    };
  };
  
  export const buildUninstallModule = async (
    chainId: number,
    client: PublicClient,
    safeAddress: Address,
    address: Address,
    type: ModuleType
  ): Promise<Transaction> => {
    const isSmartSession = await isInstalled(
      chainId,
      client,
      safeAddress,
      SMART_SESSIONS_ADDRESS,
      'validator'
    );
  
    const data = encodeAbiParameters(
      [
        { name: 'prev', type: 'address' },
        {
          name: 'disableModuleData',
          type: 'bytes',
        },
      ],
      [isSmartSession ? SMART_SESSIONS_ADDRESS : SENTINEL_ADDRESS, '0x']
    );
  
    const encodeUninstallModule = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'uninstallModule',
          inputs: [
            {
              name: 'moduleType',
              type: 'uint256',
              internalType: 'uint256',
            },
            {
              name: 'module',
              type: 'address',
              internalType: 'address',
            },
            {
              name: 'deInitData',
              type: 'bytes',
              internalType: 'bytes',
            },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'uninstallModule',
      args: [parseModuleTypeId(type), getAddress(address), data],
    });
  
    return {
      to: safeAddress,
      value: BigInt(0),
      data: encodeUninstallModule,
    };
  };
  
  export const isInstalled = async (
    chainId: number,
    client: PublicClient,
    safeAddress: Address,
    address: Address,
    type: ModuleType
  ): Promise<boolean> => {
    // const client = getClient({
    //   rpcUrl: NetworkUtil.getNetworkByChainId(chainId)?.url!,
    // });
  
    // Create the account object
    const account = getAccount({
      address: safeAddress,
      type: 'safe',
    });
  
    const accountModule = getModule({
      module: address,
      initData: '0x',
      type: type,
    });
  
    try {
      return await isModuleInstalled({
        client,
        account,
        module: accountModule,
      });
    } catch {
      return false;
    }
  };
  