pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../triggers/TriggerInterface.sol";
import "../../interfaces/DSProxyInterface.sol";
import "./StrategyData.sol";
import "./Subscriptions.sol";
import "./BotAuth.sol";
import "./Registry.sol";

contract Executor is StrategyData {

    Registry public constant registry = Registry(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    Subscriptions public constant subscriptions = Subscriptions(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function callStrategy(
        uint _strategyId,
        bytes[] memory triggerCallData,
        bytes[] memory actionsCallData
    ) public {
        Strategy memory strategy = subscriptions.getStrategy(_strategyId);

        // check bot auth
        checkCallerAuth();

        // check if all the triggers are true
        checkTriggers(strategy, triggerCallData);

        // execute actions
        callActions(strategy, actionsCallData);
    }

    function checkCallerAuth() internal view {
        address botAuthAddr = registry.getAddr(keccak256("BotAuth"));
        require(BotAuth(botAuthAddr).isApproved(msg.sender), "msg.sender is not approved caller");
    }

    function checkTriggers(Strategy memory strategy, bytes[] memory triggerCallData) internal {
        for (uint i = 0; i < strategy.triggers.length; ++i) {
            address triggerAddr = registry.getAddr(strategy.triggers[i].id);

            bool isTriggered = TriggerInterface(triggerAddr).isTriggered(triggerCallData[i]);
            require(isTriggered, "Trigger not activated");
        }
    }

    function callActions(Strategy memory strategy, bytes[] memory actionsCallData) internal {
        address actionManagerProxyAddr = registry.getAddr(keccak256("ActionManagerProxy"));

        DSProxyInterface(strategy.proxy).execute{value: msg.value}(actionManagerProxyAddr,
        abi.encodeWithSignature(
            "takeAction(bytes[])",
            actionsCallData
        ));
    }
}
