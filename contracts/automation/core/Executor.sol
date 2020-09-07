pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./StrategyData.sol";
import "./BotAuth.sol";
import "./Registry.sol";

contract Executor is StrategyData {

    Registry public registry = Registry(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function callStrategy(
        bytes32 _strategyId,
        bytes[] memory triggerCallData,
        bytes[] memory actionsCallData
    ) public {
        address botAuthAddr = registry.getAddr(keccak256("BotAuth"));
        require(BotAuth(botAuthAddr).isApproved(msg.sender), "msg.sender is not approved caller");

        // check if triggers are true
        // require(triggered, "Triggers arent active");

        // call actions
        // for (uint i = 0; i < _strategy.actions.length; ++i) {

        // }

        //TODO: logs
    }
}
