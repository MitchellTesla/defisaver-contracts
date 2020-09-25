pragma solidity ^0.6.0;

abstract contract ActionInterface {
    function executeAction(bytes memory, bytes32[] memory) virtual public returns (bytes32);
    function actionType() virtual public returns (uint8);
}
