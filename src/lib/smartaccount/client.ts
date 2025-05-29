import { createSmartAccountClient } from "permissionless/clients";
import { createPimlicoClient, PimlicoClient } from 'permissionless/clients/pimlico';
import { SmartAccountClient } from "permissionless";
import { Hex, http } from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";
import { erc7579Actions } from "permissionless/actions/erc7579";

export const getPimlicoClient = (bundlerEndpoint: string): PimlicoClient => {
    return createPimlicoClient({
      transport: http(bundlerEndpoint),
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7',
      },
    });
  };

export const getSmartAccountClient =  (
  account: SmartAccount,
  bundlerEndpoint: string,
):  SmartAccountClient => {


  const pimlicoClient = getPimlicoClient(bundlerEndpoint);
  const smartAccountClient = createSmartAccountClient({
    account: account,
    bundlerTransport: http(bundlerEndpoint),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () =>
        (await pimlicoClient.getUserOperationGasPrice()).fast,
    },
  }).extend(erc7579Actions());
  return smartAccountClient as unknown as SmartAccountClient;
};

export const waitForExecution = async (
    chainId: number,
    bundlerEndpoint: string,
    userOperationHash: string
  ) => {
    const pimlicoBundlerClient = getPimlicoClient(bundlerEndpoint);
    const receipt = await pimlicoBundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash as Hex,
      timeout: 60000,
    });
  
    return receipt;
  };
  