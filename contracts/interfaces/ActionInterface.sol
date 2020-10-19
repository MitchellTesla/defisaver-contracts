pragma solidity ^0.6.0;

import "../automation/core/Registry.sol";

abstract contract ActionInterface {
    Registry public constant registry = Registry(0x2f111D6611D3a3d559992f39e3F05aC0385dCd5D);

    enum ActionType { FL_ACTION, STANDARD_ACTION, CUSTOM_ACTION }

    function executeAction(uint, bytes memory, bytes32[] memory) virtual public payable returns (bytes32);
    function actionType() virtual public returns (uint8);
}
