pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

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

        Trigger[] triggers;
        Action[] actions;
    }
}
