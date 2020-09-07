pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./StrategyData.sol";

contract Subscriptions is StrategyData {

    // if mcd-ratio for id #4545 is under 190%, repay to 220%

    Strategy[] internal strategies;

    function subscribe(Strategy memory newStrategy) public {

    }

    function update(uint _subId, Strategy memory updatedStrategy) public {

    }

    function unsubscribe(uint _subId) public {

    }

    function getStrategy(uint _subId) public view returns (Strategy memory) {
        return strategies[_subId];
    }
}
