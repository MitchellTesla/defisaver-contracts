pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../FLActionInterface.sol";
import "../../core/Subscriptions.sol";

contract FLTaker is FLActionInterface {

    Subscriptions public constant subscriptions = Subscriptions(0x5b1869D9A4C187F2EAa108f3062412ecf0526b24);

    function executeAction(uint _actionId, bytes memory _callData, bytes32[] memory _returnValues) override public returns (bytes memory) {

        (uint amount, address token, uint8 flType) = parseParamData(_callData);

        if (_actionId != 0) {
            Subscriptions.Action memory a = subscriptions.getAction(_actionId);
            // what if something is empty?
            // (uint amount, address token, uint8 flType) = parseParamData(_callData);

        }

        return abi.encode(amount, token, flType);

    }

    function parseSubData(bytes memory _data) public pure returns (uint amount,address token,uint8 flType) {
        (amount, token, flType) = abi.decode(_data,(uint256,address,uint8));
    }

    function parseParamData(bytes memory _data) public pure returns (uint amount,address token,uint8 flType) {
        (amount, token, flType) = abi.decode(_data,(uint256,address,uint8));
    }

    function actionType() override public returns (uint8) {
        return 0;
    }

}
