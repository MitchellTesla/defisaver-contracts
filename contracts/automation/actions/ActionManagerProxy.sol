pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";
import "../../interfaces/ILendingPool.sol";
import "../../auth/ProxyPermission.sol";
import "./ActionExecutor.sol";

contract ActionManagerProxy is ProxyPermission {

    Registry public constant registry = Registry(0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb);

    // TODO: take care of eth sending
    function takeAction(
        bytes[] memory actions
    ) public {

        (bool flActive, uint flAmount, address flToken) = checkFl(actions[0]);

        address payable actionExecutorAddr = payable(registry.getAddr(keccak256("ActionExecutor")));

        givePermission(actionExecutorAddr);

        bytes memory encodedActions = abi.encode(actions, address(this));

        if (flActive) {
            address aaveLendingPool = registry.getAddr(keccak256("AaveLendingPool"));

            ILendingPool(aaveLendingPool).flashLoan(
                actionExecutorAddr, flToken, flAmount, encodedActions);

        } else {
            ActionExecutor(actionExecutorAddr).executeOperation(address(0), 0, 0, encodedActions);
        }

        removePermission(actionExecutorAddr);
    }

    function checkFl(bytes memory _firstAction) internal returns (bool, uint, address) {
        // TODO: proper check
        if (registry.getAddr(getActionId(_firstAction)) == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            return (true, 0, address(0));
        }

        return (false, 0, address(0));
    }

    function getActionId(bytes memory _action) internal pure returns (bytes32 id) {
        assembly {
            id := mload(_action)
        }
    }

}
