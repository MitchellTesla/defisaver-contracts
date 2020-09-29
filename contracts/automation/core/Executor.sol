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

    Registry public constant registry = Registry(0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab);
    Subscriptions public constant subscriptions = Subscriptions(0x5b1869D9A4C187F2EAa108f3062412ecf0526b24);

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
        Strategy memory strategy = subscriptions.getStrategy(_strategyId);
        require(strategy.active, "Strategy is not active");

        // check bot auth
        checkCallerAuth(_strategyId);

        // check if all the triggers are true
        checkTriggers(strategy, _triggerCallData);

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
    function checkTriggers(Strategy memory _strategy, bytes[] memory _triggerCallData) public {
        for (uint i = 0; i < _strategy.triggerIds.length; ++i) {
            Trigger memory trigger = subscriptions.getTrigger(_strategy.triggerIds[i]);
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
                "manageActions(uint[],bytes[])",
                _strategy.actionIds,
                _actionsCallData
        ));
    }
}
