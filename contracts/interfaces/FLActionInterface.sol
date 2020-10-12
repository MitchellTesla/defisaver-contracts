pragma solidity ^0.6.0;

abstract contract FLActionInterface {
    enum ActionType { FL_ACTION, STANDARD_ACTION, CUSTOM_ACTION }

    function executeAction(uint, bytes memory) virtual public returns (bytes memory);
    function actionType() virtual public returns (uint8);
}
