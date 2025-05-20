import { getPublicClient } from "../../utils/network";
import { Hex, pad, PublicClient, SignableMessage } from "viem";
import { signMessage as signMessageViem } from "viem/actions";
import { EnableSessionData, SmartSessionModeType } from "../../lib/smartaccount/modules/smartsessions/types";
import { entryPoint07Address, getUserOperationHash, UserOperation } from "viem/account-abstraction";
import { encodeSmartSessionSignature, getOwnableValidatorMockSignature } from "@rhinestone/module-sdk";
import { DelegatedAccountParams } from "../../types";
import { getPassKeyValidator, getPKeySessionValidator, getSessionValidator } from "../../lib/smartaccount/auth";
import { buildUseSmartSession } from "../../lib/smartaccount/modules/smartsessions";
import { ToSafeSmartAccountReturnType } from "permissionless/accounts";
import { SMART_SESSIONS_ADDRESS } from "../../constants";
import { getSmartAccount } from "../../lib/smartaccount";

export async function toDelegatedAccount(
    params: DelegatedAccountParams
  ): Promise<ToSafeSmartAccountReturnType<'0.7'>>  {

    const { chainId, rpcEndpoint, signer, safeAddress, config } = params;

    let sessionDetails: {
      mode: SmartSessionModeType;
      permissionId: Hex;
      enableSessionData?: EnableSessionData;
    };
    if (config) {
      const SessionValidator = getSessionValidator(config);
      sessionDetails = await buildUseSmartSession(chainId, SessionValidator);
    }

    const client = getPublicClient(
      chainId,
      rpcEndpoint,
    );
    
    if (!chainId) {
        throw new Error('Chain ID not found');
    }

      
    const validatorAddress = SMART_SESSIONS_ADDRESS;
  
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
  
      if (!sessionDetails) {
        throw new Error('Session details are required for session transactions');
      }
  
      return encodeSmartSessionSignature({
        mode: sessionDetails.mode,
        permissionId: sessionDetails.permissionId,
        signature,
        enableSessionData: sessionDetails.enableSessionData,
      });
    };
  
    const getDummySignature = async () => {
      const signature =
        config.validator == 'passkey'
          ? await signer.getStubSignature()
          : getOwnableValidatorMockSignature({
              threshold: 1,
            });
  
      if (!sessionDetails) {
        throw new Error('Session details are required for session transactions');
      }
  
      return encodeSmartSessionSignature({
        mode: sessionDetails.mode,
        permissionId: sessionDetails.permissionId,
        signature,
        enableSessionData: sessionDetails.enableSessionData,
      });
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
  