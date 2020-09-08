pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../triggers/TriggerInterface.sol";
import "../../interfaces/DSProxyInterface.sol";
import "./StrategyData.sol";
import "./Subscriptions.sol";
import "./BotAuth.sol";
import "./Registry.sol";

contract Executor is StrategyData {

    Registry public registry = Registry(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    Subscriptions public subscriptions = Subscriptions(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function callStrategy(
        uint _strategyId,
        bytes[] memory triggerCallData,
        bytes[] memory actionsCallData
    ) public {
        Strategy memory strategy = subscriptions.getStrategy(_strategyId);

        // check bot and users auth
        checkCallerAuth();
        checkProxyAuth(strategy.proxy);

        // check if all the triggers are true
        checkTriggers(strategy, triggerCallData);

        // execute actions
        callActions(strategy, actionsCallData);
    }

    function checkCallerAuth() internal view {
        address botAuthAddr = registry.getAddr(keccak256("BotAuth"));
        require(BotAuth(botAuthAddr).isApproved(msg.sender), "msg.sender is not approved caller");
    }

    /// @notice Checks if we have the DSProxy authorization
    function checkProxyAuth(address _proxy) internal view {

    }

    function checkTriggers(Strategy memory strategy, bytes[] memory triggerCallData) internal {
        for (uint i = 0; i < strategy.triggers.length; ++i) {
            address triggerAddr = registry.getAddr(strategy.triggers[i].id);

            bool isTriggered = TriggerInterface(triggerAddr).isTriggered(triggerCallData[i]);
            require(isTriggered, "Trigger not activated");
        }
    }

    function callActions(Strategy memory strategy, bytes[] memory actionsCallData) internal {
        for (uint i = 0; i < strategy.actions.length; ++i) {
            address actionAddr = registry.getAddr(strategy.actions[i].id);

            DSProxyInterface(strategy.proxy).execute{value: msg.value}(actionAddr, actionsCallData[i]);
        }
    }
}
