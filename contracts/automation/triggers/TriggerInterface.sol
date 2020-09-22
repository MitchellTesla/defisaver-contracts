pragma solidity ^0.6.0;

abstract contract TriggerInterface {
    function isTriggered(bytes memory, bytes memory) virtual public returns (bool);
}
