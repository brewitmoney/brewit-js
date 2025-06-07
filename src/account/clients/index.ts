import { getSmartAccountClient } from "../../lib/smartaccount/client";
import { SmartAccount } from "viem/account-abstraction";
import { SmartAccountClient } from "permissionless";


export const createAccountClient = (account: SmartAccount, bundlerEndpoint: string, usePaymaster: boolean = true): SmartAccountClient => {

    const client = getSmartAccountClient(account, bundlerEndpoint, usePaymaster);
    return client;
}