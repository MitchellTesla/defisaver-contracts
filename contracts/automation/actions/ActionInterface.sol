pragma solidity ^0.6.0;

abstract contract ActionInterface {
    function executeAction(bytes memory) virtual public;
}
