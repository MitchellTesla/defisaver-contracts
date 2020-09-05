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
        Trigger[] triggers;
        Action[] actions;
        bool active;
    }
}
