import { getSmartAccountClient } from "../../lib/smartaccount/client";
import { SmartAccount } from "viem/account-abstraction";
import { SmartAccountClient } from "permissionless";


export const createAccountClient = (account: SmartAccount, bundlerEndpoint: string): SmartAccountClient => {

    const client = getSmartAccountClient(account, bundlerEndpoint);
    return client;
}