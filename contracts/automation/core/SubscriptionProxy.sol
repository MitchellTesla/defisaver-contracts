pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../DS/DSGuard.sol";
import "../../DS/DSAuth.sol";
import "./Subscriptions.sol";

/// @title Handles auth and calls subscription contract
contract SubscriptionProxy is StrategyData {

    address public constant FACTORY_ADDRESS = 0x5a15566417e6C1c9546523066500bDDBc53F88C7;

    address public constant EXECUTOR_ADDRESS = 0x1fe73e3525E709D0FBfcd089e0158c5248d0328e;
    address public constant SUBSCRIPTION_ADDRESS = 0x76a185a4f66C0d09eBfbD916e0AD0f1CDF6B911b;

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
