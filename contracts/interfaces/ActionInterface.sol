pragma solidity ^0.6.0;

abstract contract ActionInterface {
    enum ActionType { FL_ACTION, STANDARD_ACTION, CUSTOM_ACTION }

    function executeAction(uint, bytes memory, bytes32[] memory) virtual public returns (bytes32);
    function actionType() virtual public returns (uint8);
}
