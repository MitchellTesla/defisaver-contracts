pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";
import "../../interfaces/ILendingPool.sol";
import "../../auth/ProxyPermission.sol";
import "./ActionExecutor.sol";
import "./ActionInterface.sol";
import "../../flashloan/GeneralizedFLTaker.sol";

contract ActionManagerProxy is GeneralizedFLTaker, ProxyPermission {

    Registry public constant registry = Registry(0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab);

    // TODO: take care of eth sending
    function takeAction(
        bytes[] memory actions
    ) public {

        (bool flActive, uint flAmount, address flToken) = checkFl(actions[0]);

        address payable actionExecutorAddr = payable(registry.getAddr(keccak256("ActionExecutor")));
        bytes memory encodedActions = abi.encode(actions, address(this));

        givePermission(actionExecutorAddr);

        if (flActive) {
            takeLoan(actionExecutorAddr, flToken, flAmount, encodedActions, LoanType.AAVE);
        } else {
            ActionExecutor(actionExecutorAddr).executeOperation(address(0), 0, 0, encodedActions);
        }

        removePermission(actionExecutorAddr);
    }

    function checkFl(bytes memory _firstAction) internal returns (bool, uint, address) {
        (bytes32 id, bytes memory data) = abi.decode(_firstAction, (bytes32, bytes));
        address payable actionExecutorAddr = payable(registry.getAddr(id));

        if (ActionInterface(actionExecutorAddr).actionType() == 0) {

        }

        return (false, 0, address(0));
    }

}
