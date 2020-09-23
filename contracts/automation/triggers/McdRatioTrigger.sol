pragma solidity ^0.6.0;

import "../../DS/DSMath.sol";
import "../../interfaces/Manager.sol";
import "../../interfaces/Vat.sol";
import "../../interfaces/Spotter.sol";
import "../core/Subscriptions.sol";

import "./TriggerInterface.sol";

contract McdRatioTrigger is TriggerInterface, DSMath {

    Manager public constant manager = Manager(0x5ef30b9986345249bc32d8928B7ee64DE9435E39);
    Vat public constant vat = Vat(0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B);
    Spotter public constant spotter = Spotter(0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3);

    Subscriptions public constant subscriptions = Subscriptions(0x5b1869D9A4C187F2EAa108f3062412ecf0526b24);

    enum RatioState { OVER, UNDER }

    function isTriggered(bytes memory _callData, bytes memory _triggerData) public override returns (bool) {
        (uint nextPrice) = parseParamData(_callData);
        (uint cdpId, uint ratio, RatioState state) = parseTriggerData(_triggerData);

        uint currRatio = getRatio(cdpId, nextPrice);

        if (state == RatioState.OVER) {
            if (currRatio > ratio) return true;
        }

        if (state == RatioState.UNDER) {
            if (currRatio < ratio) return true;
        }

        return false;
    }

    function parseTriggerData(bytes memory _data) public pure returns (uint, uint, RatioState) {
        (uint cdpId, uint ratio, uint8 state) = abi.decode(_data, (uint256,uint256,uint8));

        return (cdpId, ratio, RatioState(state));
    }

    function parseParamData(bytes memory _data) public pure returns (uint nextPrice) {
        (nextPrice) = abi.decode(_data, (uint256));
    }

    /// @notice Gets CDP ratio
    /// @param _cdpId Id of the CDP
    /// @param _nextPrice Next price for user
    function getRatio(uint _cdpId, uint _nextPrice) public view returns (uint) {
        bytes32 ilk = manager.ilks(_cdpId);
        uint price = (_nextPrice == 0) ? getPrice(ilk) : _nextPrice;

        (uint collateral, uint debt) = getCdpInfo(_cdpId, ilk);

        if (debt == 0) return 0;

        return rdiv(wmul(collateral, price), debt) / (10 ** 18);
    }

    /// @notice Gets CDP info (collateral, debt)
    /// @param _cdpId Id of the CDP
    /// @param _ilk Ilk of the CDP
    function getCdpInfo(uint _cdpId, bytes32 _ilk) public view returns (uint, uint) {
        address urn = manager.urns(_cdpId);

        (uint collateral, uint debt) = vat.urns(_ilk, urn);
        (,uint rate,,,) = vat.ilks(_ilk);

        return (collateral, rmul(debt, rate));
    }

    /// @notice Gets a price of the asset
    /// @param _ilk Ilk of the CDP
    function getPrice(bytes32 _ilk) public view returns (uint) {
        (, uint mat) = spotter.ilks(_ilk);
        (,,uint spot,,) = vat.ilks(_ilk);

        return rmul(rmul(spot, spotter.par()), mat);
    }
}
