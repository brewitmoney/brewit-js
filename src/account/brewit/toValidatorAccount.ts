import {
    Hex,
    pad,
    SignableMessage,
  } from 'viem';

  import { getChainId, signMessage as signMessageViem } from 'viem/actions';
  import {
    entryPoint07Address,
    getUserOperationHash,
    UserOperation,
  } from 'viem/account-abstraction';
import { getOwnableValidatorMockSignature } from '@rhinestone/module-sdk';
import { getSmartAccount } from "../../lib/smartaccount";
import { getPassKeyValidator, getPKeySessionValidator } from "../../lib/smartaccount/auth";
import { ToSafeSmartAccountReturnType } from 'permissionless/accounts';
import { MainAccountParams } from '../../types';
import { getPublicClient } from '../../utils/network';
import { OWNABLE_VALIDATOR_ADDRESS, WEBAUTHN_VALIDATOR_ADDRESS } from "../../constants";



export async function toValidatorAccount(
    params: MainAccountParams
  ): Promise<ToSafeSmartAccountReturnType<'0.7'>> {
    const { chainId, rpcEndpoint, signer, safeAddress, config } = params;

    

    const client = getPublicClient(
      chainId,
      rpcEndpoint,
    );
    
    if (!chainId) {
        throw new Error('Chain ID not found');
    }

    const validatorAddress =
    config.validator == 'passkey'
      ? WEBAUTHN_VALIDATOR_ADDRESS
      : OWNABLE_VALIDATOR_ADDRESS;
  const nonceKey = validatorAddress
    ? BigInt(
        pad(validatorAddress, {
          dir: 'right',
          size: 24,
        }) || 0
      )
    : undefined;
  
    const signMessage = ({
      message,
    }: {
      message: SignableMessage;
    }): Promise<Hex> => {
      return signMessageViem(client, {
        account: signer,
        message: message,
      });
    };
  
    const signUserOperation = async (userOperation: UserOperation<'0.7'>) => {
      const signature = await signMessage({
        message: {
          raw: getUserOperationHash({
            userOperation,
            entryPointAddress: entryPoint07Address,
            entryPointVersion: '0.7',
            chainId: chainId,
          }),
        },
      });
  
      return signature;
    };
  
    const getDummySignature = async () => {
      const signature =
        config.validator == 'passkey'
          ? await signer.getStubSignature()
          : getOwnableValidatorMockSignature({
              threshold: 1,
            });
  
      return signature;
    };

    const smartAccount = await getSmartAccount({
      client,
      nonceKey,
      signer: config.validator === 'ownable' ? signer : undefined,
      address: safeAddress,
      validators: [
        config.validator === 'passkey'
          ? await getPassKeyValidator(signer)
          : getPKeySessionValidator(signer),
      ],
      signUserOperation: signUserOperation,
      getDummySignature: getDummySignature,
    });
  
    return smartAccount;
  }
  