pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../../exchange/SaverExchangeCore.sol";
import "../ActionInterface.sol";

contract DfsSell is ActionInterface, SaverExchangeCore {

    function executeAction(bytes memory _callData, bytes32[] memory _returnValues) override public returns (bytes32) {
        ExchangeData memory exchangeData = parseParamData(_callData, _returnValues);

        (, uint exchangedAmount) = _sell(exchangeData);

        return bytes32(exchangedAmount);
    }

    function actionType() override public returns (uint8) {
        return 1;
    }

    function parseParamData(
        bytes memory _data,
        bytes32[] memory _returnValues
    ) public pure returns (ExchangeData memory exchangeData) {
        uint8[] memory inputMapping;
        bytes memory exData;

        (exData, inputMapping) = abi.decode(_data, (bytes, uint8[]));

        exchangeData = unpackExchangeData(exData);

        // mapping return values to new inputs
        if (inputMapping.length > 0 && _returnValues.length > 0) {
            for (uint i = 0; i < inputMapping.length; i += 2) {
                bytes32 returnValue = _returnValues[inputMapping[i + 1]];

                if (inputMapping[i] == 0) {
                    exchangeData.srcAddr = address(bytes20(returnValue));
                } else if (inputMapping[i] == 1) {
                    exchangeData.destAddr = address(bytes20(returnValue));
                } else if (inputMapping[i] == 2) {
                    exchangeData.srcAmount = uint(returnValue);
                }
            }
        }
    }

}
