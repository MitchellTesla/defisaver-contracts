pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";

import "../../interfaces/ILendingPool.sol";
import "../../auth/ProxyPermission.sol";
import "./ActionExecutor.sol";
import "./FLActionInterface.sol";
import "../../flashloan/GeneralizedFLTaker.sol";

contract ActionManagerProxy is GeneralizedFLTaker, ProxyPermission {

    Registry public constant registry = Registry(0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab);

    // TODO: take care of eth sending
    function takeAction(
        uint[] memory _actionIds,
        bytes[] memory actions
    ) public {

        (uint flAmount, address flToken, uint8 flType) = checkFl(_actionIds[0], actions[0]);

        address payable actionExecutorAddr = payable(registry.getAddr(keccak256("ActionExecutor")));
        bytes memory encodedActions = abi.encode(actions, address(this));

        givePermission(actionExecutorAddr);

        if (flType != 0) {
            takeLoan(actionExecutorAddr, flToken, flAmount, encodedActions, LoanType(flType));
        } else {
            ActionExecutor(actionExecutorAddr).executeOperation(address(0), 0, 0, encodedActions);
        }

        removePermission(actionExecutorAddr);
    }

    function checkFl(uint _actionId, bytes memory _firstAction) internal returns (uint256, address, uint8) {
        (bytes32 id, bytes memory data) = abi.decode(_firstAction, (bytes32, bytes));
        address payable actionExecutorAddr = payable(registry.getAddr(id));

        if (FLActionInterface(actionExecutorAddr).actionType() == 0) {
            bytes32[] memory _returnValues;
            bytes memory flData = FLActionInterface(actionExecutorAddr).executeAction(_actionId, data, _returnValues);
            (uint flAmount, address loanAddr, uint8 flType) = abi.decode(flData, (uint256,address,uint8));

            return (flAmount, loanAddr, flType);
        }

        return (0, address(0), 0);
    }

}
