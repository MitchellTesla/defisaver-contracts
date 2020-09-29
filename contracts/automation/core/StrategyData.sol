pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

/// @title Struct Data in a separate contract soit can be used in multiple places
contract StrategyData {

    struct Trigger {
        bytes32 id;
        bytes data;
    }

    struct Action {
        bytes32 id;
        bytes data;
    }

    struct Strategy {
        address user;
        address proxy;
        bool active;
        uint[] triggerIds;
        uint[] actionIds;
    }
}
