import { encodePacked, Hex, Address, keccak256 } from 'viem';
import { abi, encodeEnableSessionSignatureAbi } from './abi';
import { ActionData, ERC7739Data, PolicyData } from './types';

export type Session = {
  sessionValidator: Address;
  sessionValidatorInitData: Hex;
  // todo: make this optional with default 0
  salt: Hex;
  // todo: make the below optional but require one of them to be defined
  userOpPolicies: PolicyData[];
  erc7739Policies: ERC7739Data;
  actions: ActionData[];
  permitERC4337Paymaster: boolean;
};

export const getActionId = ({
  target,
  selector,
}: {
  target: Address;
  selector: Hex;
}) => {
  return keccak256(encodePacked(['address', 'bytes4'], [target, selector]));
};

// Function to compute ConfigId in the frontend
export function computeConfigId(
  permissionId: Hex,
  actionId: Hex,
  account: Hex
) {
  // Compute ActionPolicyId
  const actionPolicyId = keccak256(
    encodePacked(['bytes32', 'bytes32'], [permissionId, actionId])
  );

  // Compute ConfigId
  const configId = keccak256(
    encodePacked(['address', 'bytes32'], [account, actionPolicyId])
  );

  return configId;
}
