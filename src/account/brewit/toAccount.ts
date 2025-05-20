import { AccountParams, DelegatedAccountConfig, DelegatedAccountParams, isDelegatedConfig, MainAccountParams } from "../../types";
import { toValidatorAccount } from "./toValidatorAccount";
import { getSmartAccount } from "../../lib/smartaccount";
import { toDelegatedAccount } from "./toDelegatedAccount";
import { getPublicClient } from "../../utils/network";
import { ToSafeSmartAccountReturnType } from "permissionless/accounts";


  export const toAccount = async (
    params: AccountParams
  ): Promise<ToSafeSmartAccountReturnType<'0.7'>> => {
    const { chainId, rpcEndpoint, signer, safeAddress, config, type } = params;
  
    const client = getPublicClient(
      chainId,
     rpcEndpoint,
    );
    let smartAccount;
    if(config) {
      if (type == 'delegated') {
        if (isDelegatedConfig(config)) {
          smartAccount = await toDelegatedAccount(
            params as DelegatedAccountParams
          );
        }
        else {
          throw new Error('Invalid delegated account config');
        }
      } 
      else {
        smartAccount = await toValidatorAccount(
          params as MainAccountParams
        );
      }
    } else {
      if(type == 'main') {
        smartAccount = await getSmartAccount({
          client,
          signer,
          address: safeAddress,
        });
      } else {
        throw new Error('Invalid account type');
      }
    }
    
  
    return smartAccount;
  
    // return await smartAccount.sendUserOperation({ calls: calls });
  };
  