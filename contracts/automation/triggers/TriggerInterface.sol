pragma solidity ^0.6.0;

abstract contract TriggerInterface {
    function parseParamData(bytes memory _data) virtual public;
    function isTriggered(bytes memory) virtual public returns (bool);
}
