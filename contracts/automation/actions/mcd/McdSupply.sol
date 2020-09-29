pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../../interfaces/Manager.sol";
import "../../../interfaces/Vat.sol";
import "../../../interfaces/Join.sol";
import "../../../DS/DSMath.sol";
import "../ActionInterface.sol";

contract McdSupply is ActionInterface, DSMath {
    address public constant MANAGER_ADDRESS = 0x5ef30b9986345249bc32d8928B7ee64DE9435E39;
    address public constant VAT_ADDRESS = 0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B;
    address public constant ETH_JOIN_ADDRESS = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;

    Manager public constant manager = Manager(MANAGER_ADDRESS);
    Vat public constant vat = Vat(VAT_ADDRESS);

    // TODO: where is the money supplied comming from, (DSProxy/User)?

    function executeAction(uint _actionId, bytes memory _callData, bytes32[] memory _returnValues) override public returns (bytes32) {
        int convertAmount = 0;

        (uint cdpId, uint amount, address joinAddr) = parseParamData(_callData, _returnValues);

        if (joinAddr == ETH_JOIN_ADDRESS) {
            Join(joinAddr).gem().deposit{value: amount}();
            convertAmount = toPositiveInt(amount);
        } else {
            convertAmount = toPositiveInt(convertTo18(joinAddr, amount));
        }

        Join(joinAddr).gem().approve(joinAddr, amount);
        Join(joinAddr).join(address(this), amount);

        vat.frob(
            manager.ilks(cdpId),
            manager.urns(cdpId),
            address(this),
            address(this),
            convertAmount,
            0
        );

        return bytes32(convertAmount);
    }

    function actionType() override public returns (uint8) {
        return 1;
    }

    function parseParamData(
        bytes memory _data,
        bytes32[] memory _returnValues
    ) public pure returns (uint cdpId,uint amount, address joinAddr) {
        uint8[] memory inputMapping;

        (cdpId, amount, joinAddr, inputMapping) = abi.decode(_data, (uint256,uint256,address,uint8[]));

        // mapping return values to new inputs
        if (inputMapping.length > 0 && _returnValues.length > 0) {
            for (uint i = 0; i < inputMapping.length; i += 2) {
                bytes32 returnValue = _returnValues[inputMapping[i + 1]];

                if (inputMapping[i] == 0) {
                    cdpId = uint(returnValue);
                } else if (inputMapping[i] == 1) {
                    amount = uint(returnValue);
                } else if (inputMapping[i] == 2) {
                    joinAddr = address(bytes20(returnValue));
                }
            }
        }
    }


    /// @notice Converts a uint to int and checks if positive
    /// @param _x Number to be converted
    function toPositiveInt(uint _x) internal pure returns (int y) {
        y = int(_x);
        require(y >= 0, "int-overflow");
    }

    /// @notice Converts a number to 18 decimal percision
    /// @param _joinAddr Join address of the collateral
    /// @param _amount Number to be converted
    function convertTo18(address _joinAddr, uint256 _amount) internal view returns (uint256) {
        return mul(_amount, 10 ** (18 - Join(_joinAddr).dec()));
    }
}
