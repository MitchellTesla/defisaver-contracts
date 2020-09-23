pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../triggers/TriggerInterface.sol";
import "../../interfaces/DSProxyInterface.sol";
import "./StrategyData.sol";
import "./Subscriptions.sol";
import "./BotAuth.sol";
import "./Registry.sol";

contract Executor is StrategyData {

    Registry public constant registry = Registry(0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab);
    Subscriptions public constant subscriptions = Subscriptions(0x5b1869D9A4C187F2EAa108f3062412ecf0526b24);

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

    function checkTriggers(Strategy memory strategy, bytes[] memory triggerCallData) public {
        for (uint i = 0; i < strategy.triggerIds.length; ++i) {
            Trigger memory trigger = subscriptions.getTrigger(strategy.triggerIds[i]);
            address triggerAddr = registry.getAddr(trigger.id);

            bool isTriggered = TriggerInterface(triggerAddr).isTriggered(triggerCallData[i], trigger.data);
            require(isTriggered, "Trigger not activated");
        }
    }

    function callActions(Strategy memory strategy, bytes[] memory actionsCallData) internal {
        address actionManagerProxyAddr = registry.getAddr(keccak256("ActionManagerProxy"));

        DSProxyInterface(strategy.proxy).execute{value: msg.value}(
            actionManagerProxyAddr,
            abi.encodeWithSignature(
                "takeAction(bytes[])",
                actionsCallData
        ));
    }
}
