pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../core/Subscriptions.sol";
import "../../core/DFSRegistry.sol";

import "../../../mcd/saver/McdSaverProxyHelper.sol";
import "../../../interfaces/Manager.sol";
import "../../../interfaces/Spotter.sol";
import "../../../interfaces/Vat.sol";
import "../../../interfaces/DaiJoin.sol";
import "../../../interfaces/Jug.sol";
import "../../../DS/DSMath.sol";
import "../ActionBase.sol";

import "../../../utils/DebugInfo.sol";

contract McdGenerate is ActionBase, DSMath, MCDSaverProxyHelper {
    address public constant MANAGER_ADDRESS = 0x5ef30b9986345249bc32d8928B7ee64DE9435E39;
    address public constant VAT_ADDRESS = 0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B;
    address public constant JUG_ADDRESS = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
    address public constant SPOTTER_ADDRESS = 0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3;
    address public constant DAI_JOIN_ADDRESS = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;

    Manager public constant manager = Manager(MANAGER_ADDRESS);
    Vat public constant vat = Vat(VAT_ADDRESS);
    Spotter public constant spotter = Spotter(SPOTTER_ADDRESS);

    function executeAction(uint _actionId, bytes memory _callData, bytes32[] memory _returnValues) override public payable returns (bytes32) {
        (uint cdpId, uint amount) = parseParamData(_callData, _returnValues);
        // (cdpId, amount) = parseSubData(_actionId);

        bytes32 ilk = manager.ilks(cdpId);

        uint rate = Jug(JUG_ADDRESS).drip(ilk);
        uint daiVatBalance = vat.dai(manager.urns(cdpId));

        uint maxAmount = getMaxDebt(cdpId, ilk);

        if (amount >= maxAmount) {
            amount = maxAmount;
        }

        manager.frob(cdpId, int(0), normalizeDrawAmount(amount, rate, daiVatBalance));
        manager.move(cdpId, address(this), toRad(amount));

        if (vat.can(address(this), address(DAI_JOIN_ADDRESS)) == 0) {
            vat.hope(DAI_JOIN_ADDRESS);
        }

        DaiJoin(DAI_JOIN_ADDRESS).exit(address(this), amount);

        logger.Log(address(this), msg.sender, "McdGenerate", abi.encode(cdpId, amount));

        return bytes32(amount);
    }

    function actionType() override public returns (uint8) {
        return uint8(ActionType.STANDARD_ACTION);
    }

    function parseSubData(uint _actionId) public view returns (uint cdpId, uint amount) {
        if (_actionId != 0) {
            Subscriptions sub = Subscriptions(registry.getAddr(keccak256("Subscriptions")));

            Subscriptions.Action memory action = sub.getAction(_actionId);
            if (action.id != "") {
                (cdpId, amount) = abi.decode(action.data, (uint256,uint256));
            }
        }

    }

    function parseParamData(
        bytes memory _data,
        bytes32[] memory _returnValues
    ) public pure returns (uint cdpId, uint amount) {
        uint8[] memory inputMapping;

        (cdpId, amount, inputMapping) = abi.decode(_data, (uint256,uint256,uint8[]));

        // mapping return values to new inputs
        if (inputMapping.length > 0 && _returnValues.length > 0) {
            for (uint i = 0; i < inputMapping.length; i += 2) {
                bytes32 returnValue = _returnValues[inputMapping[i + 1]];

                if (inputMapping[i] == 0) {
                    cdpId = uint(returnValue);
                } else if (inputMapping[i] == 1) {
                    amount = uint(returnValue);
                }
            }
        }
    }

    /// @notice Gets the maximum amount of debt available to generate
    /// @param _cdpId Id of the CDP
    /// @param _ilk Ilk of the CDP
    /// @dev Substracts 10 wei to aviod rounding error later on
    function getMaxDebt(uint _cdpId, bytes32 _ilk) public view returns (uint) {
        uint price = getPrice(_ilk);

        (, uint mat) = spotter.ilks(_ilk);
        (uint collateral, uint debt) = getCdpInfo(manager, _cdpId, _ilk);

        return sub(sub(div(mul(collateral, price), mat), debt), 10);
    }

    /// @notice Gets a price of the asset
    /// @param _ilk Ilk of the CDP
    function getPrice(bytes32 _ilk) public view returns (uint) {
        (, uint mat) = spotter.ilks(_ilk);
        (,,uint spot,,) = vat.ilks(_ilk);

        return rmul(rmul(spot, spotter.par()), mat);
    }

}
