pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./StrategyData.sol";

// TODO: add logs
contract Subscriptions is StrategyData {

    Strategy[] internal strategies;
    Action[] internal actions;
    Trigger[] internal triggers;

    function subscribe(Strategy memory _newStrategy) public {

        actions.push(Action({
            id: bytes32("sd"),
            data: bytes("dgd")
        }));

        // strategies.push(Strategy({
        //     user: _newStrategy.user,
        //     proxy: msg.sender,
        //     active: true,
        //     triggers: triggers,
        //     actions: actions
        // }));

    }

    // function update(uint _subId, Strategy memory updatedStrategy) public {
    //     require(updatedStrategy.proxy == msg.sender, "msg.sender is not the users proxy");

    //     Strategy memory s = strategies[_subId];
    //     require(s.user != address(0), "Strategy does not exist");
    //     require(s.proxy == updatedStrategy.proxy, "Not same proxy");

    //     strategies[_subId] = updatedStrategy;
    // }

    // function unsubscribe(uint _subId) public {
    //     Strategy memory s = strategies[_subId];
    //     require(s.user != address(0), "Strategy does not exist");

    //     require(s.proxy == msg.sender, "msg.sender is not the users proxy");

    //     strategies[_subId].active = false;
    // }

    ///////////////////// VIEW ONLY FUNCTIONS ////////////////////////////

    function getStreategyCount() public view returns (uint) {
        return strategies.length;
    }

    function getStrategy(uint _subId) public view returns (Strategy memory) {
        return strategies[_subId];
    }

}
