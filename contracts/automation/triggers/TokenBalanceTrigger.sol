pragma solidity ^0.6.0;

import "../../interfaces/TriggerInterface.sol";
import "../../interfaces/ERC20.sol";

contract TokenBalanceTrigger is TriggerInterface {

    enum BalanceState { OVER, UNDER, EQUALS }

    function isTriggered(bytes memory _callData, bytes memory _subData) public override returns (bool) {
        (address tokenAddr, address userAddr, uint targetBalance, BalanceState state) = parseSubData(_subData);
        uint currBalance = ERC20(tokenAddr).balanceOf(userAddr);

        if (state == BalanceState.OVER) {
            if (currBalance > targetBalance) return true;
        } else if (state == BalanceState.UNDER) {
            if (currBalance < targetBalance) return true;
        } else if (state == BalanceState.EQUALS) {
            if (currBalance == targetBalance) return true;
        }

        return false;
    }

    function parseSubData(bytes memory _data) public pure returns (address, address, uint, BalanceState) {
        (address tokenAddr, address userAddr, uint targetBalance, uint8 state)
            = abi.decode(_data, (address, address, uint, uint8));

        return (tokenAddr, userAddr, targetBalance, BalanceState(state));
    }

    function parseParamData(bytes memory _data) public pure returns (uint nextPrice) {
        (nextPrice) = abi.decode(_data, (uint256));
    }

}
