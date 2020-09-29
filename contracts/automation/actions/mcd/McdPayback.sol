pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../../mcd/saver/McdSaverProxyHelper.sol";
import "../../../interfaces/ERC20.sol";
import "../../../interfaces/Manager.sol";
import "../../../interfaces/Vat.sol";
import "../../../interfaces/Join.sol";
import "../../../interfaces/DaiJoin.sol";
import "../../../DS/DSMath.sol";
import "../../../interfaces/ActionInterface.sol";

contract McdPayback is ActionInterface, DSMath, MCDSaverProxyHelper {
    address public constant MANAGER_ADDRESS = 0x5ef30b9986345249bc32d8928B7ee64DE9435E39;
    address public constant VAT_ADDRESS = 0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B;
    address public constant DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    Manager public constant manager = Manager(MANAGER_ADDRESS);
    Vat public constant vat = Vat(VAT_ADDRESS);

    function executeAction(uint _actionId, bytes memory _callData, bytes32[] memory _returnValues) override public returns (bytes32) {
        (uint cdpId, uint amount, address joinAddr) = parseParamData(_callData, _returnValues);

        address urn = manager.urns(cdpId);
        bytes32 ilk = manager.ilks(cdpId);

        uint wholeDebt = getAllDebt(VAT_ADDRESS, urn, urn, ilk);

        if (amount > wholeDebt) {
            ERC20(DAI_ADDRESS).transfer(getOwner(manager, cdpId), sub(amount, wholeDebt));
            amount = wholeDebt;
        }

        if (ERC20(DAI_ADDRESS).allowance(address(this), joinAddr) == 0) {
            ERC20(DAI_ADDRESS).approve(joinAddr, uint(-1));
        }

        DaiJoin(joinAddr).join(urn, amount);

        manager.frob(cdpId, 0, normalizePaybackAmount(VAT_ADDRESS, urn, ilk));

        return bytes32(amount);
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
}
