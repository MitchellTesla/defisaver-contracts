pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../interfaces/TriggerInterface.sol";
import "../../interfaces/DSProxyInterface.sol";
import "./StrategyData.sol";
import "./Subscriptions.sol";
import "./BotAuth.sol";
import "./Registry.sol";

/// @title Main entry point for executing automated strategies
contract Executor is StrategyData {

    Registry public constant registry = Registry(0x6BDEC965Ee0eE806f266B3da0F28bc8a5FBfBf38);
    // Subscriptions public constant subscriptions = Subscriptions(0x76a185a4f66C0d09eBfbD916e0AD0f1CDF6B911b);

    /// @notice Checks all the triggers and executes actions
    /// @dev Only auhtorized callers can execute it
    /// @param _strategyId Id of the strategy
    /// @param _triggerCallData All input data needed to execute triggers
    /// @param _actionsCallData All input data needed to execute actions
    function executeStrategy(
        uint _strategyId,
        bytes[] memory _triggerCallData,
        bytes[] memory _actionsCallData
    ) public {
        address subscriptionsAddr = registry.getAddr(keccak256("Subscriptions"));

        Strategy memory strategy = Subscriptions(subscriptionsAddr).getStrategy(_strategyId);
        require(strategy.active, "Strategy is not active");

        // check bot auth
        checkCallerAuth(_strategyId);

        // check if all the triggers are true
        checkTriggers(strategy, _triggerCallData, subscriptionsAddr);

        // execute actions
        callActions(strategy, _actionsCallData);
    }

    /// @notice Checks if msg.sender has auth, reverts if not
    /// @param _strategyId Id of the strategy
    function checkCallerAuth(uint _strategyId) public view {
        address botAuthAddr = registry.getAddr(keccak256("BotAuth"));
        require(BotAuth(botAuthAddr).isApproved(_strategyId, msg.sender), "msg.sender is not approved caller");
    }

    /// @notice Checks if all the triggers are true, reverts if not
    /// @param _strategy Strategy data we have in storage
    /// @param _triggerCallData All input data needed to execute triggers
    function checkTriggers(Strategy memory _strategy, bytes[] memory _triggerCallData, address _subscriptionsAddr) public {
        for (uint i = 0; i < _strategy.triggerIds.length; ++i) {
            Trigger memory trigger = Subscriptions(_subscriptionsAddr).getTrigger(_strategy.triggerIds[i]);
            address triggerAddr = registry.getAddr(trigger.id);

            bool isTriggered = TriggerInterface(triggerAddr).isTriggered(_triggerCallData[i], trigger.data);
            require(isTriggered, "Trigger not activated");
        }
    }

    /// @notice Execute all the actions in order
    /// @param _strategy Strategy data we have in storage
    /// @param _actionsCallData All input data needed to execute actions
    function callActions(Strategy memory _strategy, bytes[] memory _actionsCallData) internal {
        address actionManagerProxyAddr = registry.getAddr(keccak256("ActionManagerProxy"));

        DSProxyInterface(_strategy.proxy).execute{value: msg.value}(
            actionManagerProxyAddr,
            abi.encodeWithSignature(
                "manageActions(uint256[],bytes[])",
                _strategy.actionIds,
                _actionsCallData
        ));
    }
}
