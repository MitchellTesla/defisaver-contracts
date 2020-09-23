pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../DS/DSGuard.sol";
import "../../DS/DSAuth.sol";

import "./Subscriptions.sol";

contract SubscriptionProxy is StrategyData {

    address public constant FACTORY_ADDRESS = 0x5a15566417e6C1c9546523066500bDDBc53F88C7;
    address public constant EXECUTOR_ADDRESS = 0x9b1f7F645351AF3631a656421eD2e40f2802E6c0;
    address public constant SUBSCRIPTION_ADDRESS = 0x5b1869D9A4C187F2EAa108f3062412ecf0526b24;

    function subscribe(Trigger[] memory _triggers, Action[] memory _actions) public {
        address currAuthority = address(DSAuth(address(this)).authority());
        DSGuard guard = DSGuard(currAuthority);

        if (currAuthority == address(0)) {
            guard = DSGuardFactory(FACTORY_ADDRESS).newGuard();
            DSAuth(address(this)).setAuthority(DSAuthority(address(guard)));
        }

        guard.permit(EXECUTOR_ADDRESS, address(this), bytes4(keccak256("execute(address,bytes)")));

        Subscriptions(SUBSCRIPTION_ADDRESS).subscribe(_triggers, _actions);
    }

    function update(uint _subId, Trigger[] memory _triggers, Action[] memory _actions) public {
        Subscriptions(SUBSCRIPTION_ADDRESS).update(_subId, _triggers, _actions);
    }

    // TODO: should we remove permission if no more strategies left?
    function unsubscribe(uint _subId) public {
        Subscriptions(SUBSCRIPTION_ADDRESS).unsubscribe(_subId);
    }
}
