pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./StrategyData.sol";
import "./AuthorizedCaller.sol";

contract Executor is StrategyData {

    // TODO:

    function callStrategy(Strategy memory _strategy) public {
        //TODO: burn gas tokens

        // check if triggers are true
        // bool triggered = TriggerRegistry(TRIGGER_REGISTRY).triggersActivated(_strategy.triggers);
        // require(triggered, "Triggers arent active");

        // call actions
        // for (uint i = 0; i < _strategy.actions.length; ++i) {

        // }

        //TODO: logs
    }
}
