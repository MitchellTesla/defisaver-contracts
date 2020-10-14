pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../../interfaces/DSProxyInterface.sol";
import "../../interfaces/TokenInterface.sol";
import "../../savings/dydx/ISoloMargin.sol";
import "../../flashloan/FlashLoanReceiverBase.sol";
import "../core/Registry.sol";
import "./Subscriptions.sol";

/// @title Executes a series of actions by calling the users DSProxy
contract ActionExecutor is FlashLoanReceiverBase {

    Registry public constant registry = Registry(0x91ef8Fb063EB7e2aF38AB69b449f992cbE287C94);

    address public constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    ILendingPoolAddressesProvider public LENDING_POOL_ADDRESS_PROVIDER = ILendingPoolAddressesProvider(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8);

    // solhint-disable-next-line no-empty-blocks
    constructor() public FlashLoanReceiverBase(LENDING_POOL_ADDRESS_PROVIDER) {}

    enum FlType { NO_LOAN, AAVE_LOAN, DYDX_LOAN }

    /// @notice Executes a series of action through dsproxy
    /// @dev If first action is FL it's skipped
    /// @param _actions Array of actions (their callData)
    /// @param _actionIds Array of action ids
    /// @param _proxy DsProxy address of the user
    /// @param _loanTokenAddr Token address of the loaned token
    /// @param _loanAmount Loan amount
    /// @param _feeAmount Fee Loan amount
    /// @param _flType Type of Flash loan
    function callActions(
        bytes[] memory _actions,
        uint[] memory _actionIds,
        address _proxy,
        address _loanTokenAddr,
        uint _loanAmount,
        uint _feeAmount,
        FlType _flType
    ) public {
        bytes32[] memory responses = new bytes32[](_actions.length);
        uint i = 0;

        // Skip if FL and push first response as amount FL taken
        if (_flType != FlType.NO_LOAN) {
            i = 1;
            responses[0] = bytes32(_loanAmount);
        }

        Subscriptions sub = Subscriptions(registry.getAddr(keccak256("Subscriptions")));

        for (; i < _actions.length; ++i) {
            Subscriptions.Action memory action = sub.getAction(_actionIds[i]);

            responses[i] = DSProxyInterface(_proxy).execute{value: address(this).balance}(registry.getAddr(action.id),
                abi.encodeWithSignature(
                "executeAction(uint256,bytes,bytes32[])",
                _actionIds[i],
                _actions[i],
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

    /// @notice Aave entry point, will be called if aave FL is taken
    function executeOperation(
        address _tokenAddr,
        uint256 _amount,
        uint256 _fee,
        bytes memory _params)
    public override {
        address proxy;
        bytes[] memory actions;
        uint[] memory actionIds;

        (actions, actionIds, proxy, _tokenAddr, _amount)
            = abi.decode(_params, (bytes[],uint[],address,address,uint256));
        callActions(actions, actionIds, proxy, _tokenAddr, _amount, _fee, FlType.AAVE_LOAN);
    }

    /// @notice  DyDx FL entry point, will be called if aave FL is taken
    function callFunction(
        address sender,
        Account.Info memory account,
        bytes memory data
    ) public {

        (
            bytes[] memory actions,
            uint[] memory actionIds,
            address proxy,
            address tokenAddr,
            uint amount
        )
        = abi.decode(data, (bytes[],uint[],address,address,uint256));

        callActions(actions, actionIds, proxy, tokenAddr, amount, 0, FlType.DYDX_LOAN);

    }

    /// @notice Returns the FL amount for DyDx to the DsProxy
    function dydxPaybackLoan(address _proxy, address _loanTokenAddr, uint _amount) internal {
        if (_loanTokenAddr == WETH_ADDRESS || _loanTokenAddr == ETH_ADDRESS) {
            TokenInterface(WETH_ADDRESS).deposit{value: _amount + 2}();
            ERC20(WETH_ADDRESS).safeTransfer(_proxy, _amount + 2);
        } else {
            ERC20(_loanTokenAddr).safeTransfer(_proxy, _amount);
        }
    }
}
