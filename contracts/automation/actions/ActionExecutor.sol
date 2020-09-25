pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";
import "../../interfaces/DSProxyInterface.sol";
import "../../interfaces/TokenInterface.sol";
import "../../savings/dydx/ISoloMargin.sol";
import "../../flashloan/FlashLoanReceiverBase.sol";

contract ActionExecutor is FlashLoanReceiverBase {

    Registry public constant registry = Registry(0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab);

    address public constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    ILendingPoolAddressesProvider public LENDING_POOL_ADDRESS_PROVIDER = ILendingPoolAddressesProvider(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8);

    // solhint-disable-next-line no-empty-blocks
    constructor() public FlashLoanReceiverBase(LENDING_POOL_ADDRESS_PROVIDER) {}

    enum FlType { NO_LOAN, AAVE_LOAN, DYDX_LOAN }

    function callActions(
        bytes[] memory _actions,
        address _proxy,
        address _loanTokenAddr,
        uint _loanAmount,
        uint _feeAmount,
        FlType _flType
    ) public {
        bytes32[] memory responses = new bytes32[](_actions.length);
        uint i = 0;

        if (_flType != FlType.NO_LOAN) {
            i = 1;
            responses[0] = bytes32(_loanAmount);
        }

         for (; i < _actions.length; ++i) {
            (bytes32 id, bytes memory data) = abi.decode(_actions[i], (bytes32, bytes));

            address actionAddr = registry.getAddr(id);

            responses[i] = DSProxyInterface(_proxy).execute{value: address(this).balance}(actionAddr,
                abi.encodeWithSignature(
                "executeAction(bytes,bytes32[])",
                data,
                responses
            ));
        }

        if (_flType == FlType.AAVE_LOAN) {
            transferFundsBackToPoolInternal(_loanTokenAddr, _loanAmount.add(_feeAmount));
        }

        if (_flType == FlType.DYDX_LOAN) {
            dydxPaybackLoan(_proxy, _loanTokenAddr, _loanAmount.add(_feeAmount));
        }
    }

    // Aave entry point
    function executeOperation(
        address _tokenAddr,
        uint256 _amount,
        uint256 _fee,
        bytes memory _params)
    public override {
        address proxy;
        bytes[] memory actions;

        (actions, proxy, _tokenAddr, _amount, _fee)
            = abi.decode(_params, (bytes[],address,address,uint256,uint256));
        callActions(actions, proxy, _tokenAddr, _amount, _fee, FlType.AAVE_LOAN);
    }

    // DYDX FL entry point
    function callFunction(
        address sender,
        Account.Info memory account,
        bytes memory data
    ) public {

        (
            bytes[] memory actions,
            address proxy,
            address tokenAddr,
            uint amount,
            uint fee
        )
        = abi.decode(data, (bytes[],address,address,uint256,uint256));

        callActions(actions, proxy, tokenAddr, amount, fee, FlType.DYDX_LOAN);

    }

    function dydxPaybackLoan(address _proxy, address _loanTokenAddr, uint _amount) internal {
        if (_loanTokenAddr == WETH_ADDRESS) {
            TokenInterface(WETH_ADDRESS).deposit{value: _amount + 2}();
            ERC20(WETH_ADDRESS).safeTransfer(_proxy, _amount + 2);
        } else {
            ERC20(_loanTokenAddr).safeTransfer(_proxy, _amount);
        }
    }
}
