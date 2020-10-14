pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../interfaces/ILendingPool.sol";
import "../../auth/ProxyPermission.sol";
import "../../interfaces/FLActionInterface.sol";
import "../../flashloan/GeneralizedFLTaker.sol";
import "../core/Registry.sol";
import "./ActionExecutor.sol";
import "./Subscriptions.sol";


/// @title Handle FL taking and calls action executor
contract ActionManagerProxy is GeneralizedFLTaker, ProxyPermission {

    Registry public constant registry = Registry(0xf20Fa06314385df317D1eF374a944A7e29CCfd89);

    /// @notice Checks and takes flash loan and calls Action Executor
    /// @param _actionIds All of the actionIds for the strategy
    /// @param _actionsCallData All input data needed to execute actions
    function manageActions(uint[] memory _actionIds, bytes[] memory _actionsCallData) public payable {
        (uint flAmount, address flToken, uint8 flType) = checkFl(_actionIds[0], _actionsCallData[0]);

        address payable actionExecutorAddr = payable(registry.getAddr(keccak256("ActionExecutor")));
        bytes memory encodedActions = abi.encode(_actionsCallData, _actionIds, address(this), flToken, flAmount);

        givePermission(actionExecutorAddr);

        actionExecutorAddr.transfer(msg.value);

        if (flType != 0) {
            takeLoan(actionExecutorAddr, flToken, flAmount, encodedActions, LoanType(flType));
        } else {
            ActionExecutor(actionExecutorAddr).callActions(
                _actionsCallData,
                _actionIds,
                address(this),
                address(0),
                0,
                0,
                ActionExecutor.FlType(0)
            );
        }

        removePermission(actionExecutorAddr);
    }

    /// @notice Checks if the first action is a FL and gets it's data
    /// @param _actionId Id of first action
    /// @param _firstAction First action call data
    function checkFl(uint _actionId, bytes memory _firstAction) internal returns (uint256, address, uint8) {
        if (_firstAction.length != 0 && _actionId != 0) {
            Subscriptions sub = Subscriptions(registry.getAddr(keccak256("Subscriptions")));

            Subscriptions.Action memory action = sub.getAction(_actionId);
            address payable actionExecutorAddr = payable(registry.getAddr(action.id));

            if (FLActionInterface(actionExecutorAddr).actionType() == 0) {
                bytes memory flData = FLActionInterface(actionExecutorAddr).executeAction(_actionId, _firstAction);
                (uint flAmount, address loanAddr, uint8 flType) = abi.decode(flData, (uint256,address,uint8));

                return (flAmount, loanAddr, flType);
            }
        }

        return (0, address(0), 0);
    }

}
