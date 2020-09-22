pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./StrategyData.sol";
import "../../interfaces/DSProxyInterface.sol";

// TODO: add logs
contract Subscriptions is StrategyData {

    Strategy[] internal strategies;
    Action[] internal actions;
    Trigger[] internal triggers;

    function subscribe(Trigger[] memory _triggers, Action[] memory _actions) public {
        uint[] memory triggerIds = new uint[](_triggers.length);
        uint[] memory actionsIds = new uint[](_actions.length);

        // Populate triggers
        for (uint i = 0; i < _triggers.length; ++i) {
            triggers.push(Trigger({
                id: _triggers[i].id,
                data: _triggers[i].data
            }));

            triggerIds[i] = triggers.length - 1;
        }

        // Populate actions
        for (uint i = 0; i < _actions.length; ++i) {
            actions.push(Action({
                id: _triggers[i].id,
                data: _triggers[i].data
            }));

            actionsIds[i] = actions.length - 1;
        }

        strategies.push(Strategy({
            user: getProxyOwner(msg.sender),
            proxy: msg.sender,
            active: true,
            triggerIds: triggerIds,
            actionIds: actionsIds
        }));

    }

    function update(uint _subId, Trigger[] memory _triggers, Action[] memory _actions) public {
        Strategy memory s = strategies[_subId];
        require(s.user != address(0), "Strategy does not exist");
        require(msg.sender == s.proxy, "Proxy not strategy owner");

        // update triggers
        for (uint i = 0; i < _triggers.length; ++i) {
            triggers[s.triggerIds[i]] = Trigger({
                id: _triggers[i].id,
                data: _triggers[i].data
            });
        }

        // update actions
        for (uint i = 0; i < _actions.length; ++i) {
            actions[s.actionIds[i]] = Action({
                id: _actions[i].id,
                data: _actions[i].data
            });
        }
    }

    function unsubscribe(uint _subId) public {
        Strategy memory s = strategies[_subId];
        require(s.user != address(0), "Strategy does not exist");

        require(s.proxy == msg.sender, "msg.sender is not the users proxy");

        strategies[_subId].active = false;
    }


    function getProxyOwner(address _proxy) internal returns (address proxyOwner) {
        proxyOwner = DSProxyInterface(_proxy).owner();
        require(proxyOwner != address(0), "No proxy");
    }

    ///////////////////// VIEW ONLY FUNCTIONS ////////////////////////////

    function getTrigger(uint _triggerId) public view returns (Trigger memory) {
        return triggers[_triggerId];
    }

    function getAction(uint _actionId) public view returns (Action memory) {
        return actions[_actionId];
    }

    function getStreategyCount() public view returns (uint) {
        return strategies.length;
    }

    function getStrategy(uint _subId) public view returns (Strategy memory) {
        return strategies[_subId];
    }

}
