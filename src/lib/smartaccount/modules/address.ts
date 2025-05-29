import { Address } from 'viem';

// Define the type for chain constants
export interface ModuleAddresses {
  smartSession: Address;
  spendLimitPolicy: Address;
  uniActionPolicy: Address;
  sudoPolicy: Address;
}

// Define a mapping for chain-specific constants
const moduleAddresses: Record<number, ModuleAddresses> = {
  8453: {
    // Base Mainnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0x142fc47AE4671aB8DA45d09Dd9349b7Dc15Da8C2',
    sudoPolicy: '0xa445BD8a6eE29E410892910feA2cAb474CB21F92',
  },
  84532: {
    // Best Sepolia
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0xF209D6e6C7b3781878bA61b1da2976f80E014815',
    sudoPolicy: '0x6a2246FbC8C61AE6F6f55f99C44A58933Fcf712d',
  },
  11155111: {
    // Sepolia testnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0xF209D6e6C7b3781878bA61b1da2976f80E014815',
    sudoPolicy: '0x6a2246FbC8C61AE6F6f55f99C44A58933Fcf712d',
  },
  137: {
    // Polygon Mainnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0xF209D6e6C7b3781878bA61b1da2976f80E014815',
    sudoPolicy: '0x6a2246FbC8C61AE6F6f55f99C44A58933Fcf712d',
  },
  56: {
    // BNB Smart chain testnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0x2E2183563d1B7A7B39C4fd3824CB2Fc872dD8ec9',
    sudoPolicy: '0x51db84D818e6b670f69296F2665638970B097269',
  },
  42161: {
    // BNB Smart chain testnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0x2E2183563d1B7A7B39C4fd3824CB2Fc872dD8ec9',
    sudoPolicy: '0x51db84D818e6b670f69296F2665638970B097269',
  },
  10: {
    // Optimism Mainnet
    smartSession: '0x00000000002B0eCfbD0496EE71e01257dA0E37DE',
    spendLimitPolicy: '0x6d12b354080557a9e74db3c0e2e0c26607597a08',
    uniActionPolicy: '0xF209D6e6C7b3781878bA61b1da2976f80E014815',
    sudoPolicy: '0x6a2246FbC8C61AE6F6f55f99C44A58933Fcf712d',
  },
  // Add more chains as needed
};

// Function to get constants based on chain ID
export const getModuleByChainId = (chainId: number) => {
  return moduleAddresses[chainId] || moduleAddresses[8453]; // Default to Mainnet if chainId is not found
};
