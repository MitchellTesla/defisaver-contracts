pragma solidity ^0.6.0;

abstract contract FLActionInterface {
    function executeAction(uint, bytes memory, bytes32[] memory) virtual public returns (bytes memory);
    function actionType() virtual public returns (uint8);
}
