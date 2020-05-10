pragma solidity ^0.6.0;

import "../interfaces/TokenInterface.sol";
import "../interfaces/ExchangeInterfaceV2.sol";
import "./SaverExchangeHelper.sol";

contract SaverExchangeCore is SaverExchangeHelper {

    // first is empty to keep the legacy order in place
    enum ExchangeType { _, OASIS, KYBER, UNISWAP, ZEROX }

    enum ActionType { SELL, BUY }

    struct ExchangeData {
        address srcAddr;
        address destAddr;
        uint srcAmount;
        uint destAmount;
        uint minPrice;
        ExchangeType exchangeType;
        address exchangeAddr;
        bytes callData;
        uint256 price0x;
    }

    function _sell(ExchangeData memory exData) internal returns (address, uint) {

        address wrapper;
        uint swapedTokens;
        bool success;
        uint tokensLeft = exData.srcAmount;

        // Transform Weth address to Eth address kyber uses
        // exData.srcAddr = wethToEthAddr(exData.srcAddr);
        // exData.destAddr = wethToEthAddr(exData.destAddr);

        // if 0x is selected try first the 0x order
        if (exData.exchangeType == ExchangeType.ZEROX) {
            approve0xProxy(exData.srcAddr, exData.srcAmount);

            (success, swapedTokens, tokensLeft) = takeOrder(exData, address(this).balance);

            // either it reverts or order doesn't exist anymore, we reverts as it was explicitely asked for this exchange
            require(success && tokensLeft == 0, "0x transaction failed");

            wrapper = exData.exchangeAddr;
        }

        // check if we have already swapped with 0x, or tried swapping but failed
        if (swapedTokens == 0) {
            uint price;

            (wrapper, price)
                = getBestPrice(exData.srcAmount, exData.srcAddr, exData.destAddr, exData.exchangeType, ActionType.SELL);

            require(price > exData.minPrice || exData.price0x > exData.minPrice, "Slippage hit");

            // if 0x has better prices use 0x
            if (exData.price0x >= price) {
                approve0xProxy(exData.srcAddr, exData.srcAmount);

                (success, swapedTokens, tokensLeft) = takeOrder(exData, address(this).balance);
            }

            // 0x either had worse price or we tried and order fill failed, so call on chain swap
            if (tokensLeft > 0) {
                swapedTokens = saverSwap(exData, wrapper, ActionType.SELL);
            }
        }

        return (wrapper, swapedTokens);
    }

    function _buy(ExchangeData memory exData) internal returns (address, uint) {

        address wrapper;
        uint swapedTokens;
        bool success;
        uint tokensLeft = exData.srcAmount;

        // Transform Weth address to Eth address kyber uses
        // exData.srcAddr = wethToEthAddr(exData.srcAddr);
        // exData.destAddr = wethToEthAddr(exData.destAddr);

        // if 0x is selected try first the 0x order
        // if (exData.exchangeType == ExchangeType.ZEROX) {
        //     approve0xProxy(exData.srcAddr, exData.srcAmount);

        //     (success, swapedTokens, tokensLeft) = takeOrder(exData, address(this).balance);

        //     // either it reverts or order doesn't exist anymore, we reverts as it was explicitely asked for this exchange
        //     require(success && tokensLeft == 0, "0x transaction failed");

        //     wrapper = exData.exchangeAddr;
        // }

        // check if we have already swapped with 0x, or tried swapping but failed
        if (swapedTokens == 0) {
            uint price;

            (wrapper, price)
                = getBestPrice(exData.srcAmount, exData.srcAddr, exData.destAddr, exData.exchangeType, ActionType.BUY);

            require(price > exData.minPrice || exData.price0x > exData.minPrice, "Slippage hit");

            // if 0x has better prices use 0x
            // if (exData.price0x >= price) {
            //     approve0xProxy(exData.srcAddr, exData.srcAmount);

            //     (success, swapedTokens, tokensLeft) = takeOrder(exData, address(this).balance);
            // }

            // 0x either had worse price or we tried and order fill failed, so call on chain swap
            if (tokensLeft > 0) {
                swapedTokens = saverSwap(exData, wrapper, ActionType.BUY);
            }
        }

        return (wrapper, swapedTokens);
    }

     /// @notice Takes order from 0x and returns bool indicating if it is successful
    /// @param _exData Exchange data
    /// @param _0xFee Ether fee needed for 0x order
    function takeOrder(
        ExchangeData memory _exData,
        uint256 _0xFee
    ) private returns (bool success, uint256, uint256) {

        // solhint-disable-next-line avoid-call-value
        (success, ) = _exData.exchangeAddr.call{value: _0xFee}(_exData.callData);

        uint256 tokensSwaped = 0;
        uint256 tokensLeft = _exData.srcAmount;

        if (success) {
            // check to see if any _src tokens are left over after exchange
            tokensLeft = getBalance(_exData.srcAddr);

            // convert weth -> eth if needed
            if (_exData.srcAddr == KYBER_ETH_ADDRESS) {
                TokenInterface(WETH_ADDRESS).withdraw(
                    TokenInterface(WETH_ADDRESS).balanceOf(address(this))
                );
            }

            // get the current balance of the swaped tokens
            tokensSwaped = getBalance(_exData.destAddr);
        }

        return (success, tokensSwaped, tokensLeft);
    }

    /// @notice Returns the best estimated price from 2 exchanges
    /// @param _amount Amount of source tokens you want to exchange
    /// @param _srcToken Address of the source token
    /// @param _destToken Address of the destination token
    /// @return (address, uint) The address of the best exchange and the exchange price
    function getBestPrice(
        uint256 _amount,
        address _srcToken,
        address _destToken,
        ExchangeType _exchangeType,
        ActionType _type
    ) public returns (address, uint256) {
        uint256 expectedRateKyber;
        uint256 expectedRateUniswap;
        uint256 expectedRateOasis;

        if (_exchangeType == ExchangeType.OASIS) {
            return (OASIS_WRAPPER, getExpectedRate(OASIS_WRAPPER, _srcToken, _destToken, _amount, _type));
        }

        if (_exchangeType == ExchangeType.KYBER) {
            return (KYBER_WRAPPER, getExpectedRate(KYBER_WRAPPER, _srcToken, _destToken, _amount, _type));
        }

        if (_exchangeType == ExchangeType.UNISWAP) {
            expectedRateUniswap = getExpectedRate(UNISWAP_WRAPPER, _srcToken, _destToken, _amount, _type);
            expectedRateUniswap = expectedRateUniswap * (10**(18 - getDecimals(_destToken)));
            return (UNISWAP_WRAPPER, expectedRateUniswap);
        }

        expectedRateKyber = getExpectedRate(KYBER_WRAPPER, _srcToken, _destToken, _amount, _type);
        expectedRateUniswap = getExpectedRate(UNISWAP_WRAPPER, _srcToken, _destToken, _amount, _type);
        expectedRateUniswap = expectedRateUniswap * (10**(18 - getDecimals(_destToken)));
        expectedRateOasis = getExpectedRate(OASIS_WRAPPER, _srcToken, _destToken, _amount, _type);
        expectedRateOasis = expectedRateOasis * (10**(18 - getDecimals(_destToken)));

        if (
            (expectedRateKyber >= expectedRateUniswap) && (expectedRateKyber >= expectedRateOasis)
        ) {
            return (KYBER_WRAPPER, expectedRateKyber);
        }

        if (
            (expectedRateOasis >= expectedRateKyber) && (expectedRateOasis >= expectedRateUniswap)
        ) {
            return (OASIS_WRAPPER, expectedRateOasis);
        }

        if (
            (expectedRateUniswap >= expectedRateKyber) && (expectedRateUniswap >= expectedRateOasis)
        ) {
            return (UNISWAP_WRAPPER, expectedRateUniswap);
        }
    }

    function getExpectedRate(
        address _wrapper,
        address _srcToken,
        address _destToken,
        uint256 _amount,
        ActionType _type
    ) public returns (uint256) {
        bool success;
        bytes memory result;

        if (_type == ActionType.SELL) {
            (success, result) = _wrapper.call(abi.encodeWithSignature(
                "getSellRate(address,address,uint256)",
                _srcToken,
                _destToken,
                _amount
            ));
        } else {
            (success, result) = _wrapper.call(abi.encodeWithSignature(
                "getBuyRate(address,address,uint256)",
                _srcToken,
                _destToken,
                _amount
            ));
        }


        if (success) {
            return sliceUint(result, 0);
        } else {
            return 0;
        }
    }

    function saverSwap(ExchangeData memory exData, address _wrapper, ActionType _type) internal returns (uint swapedTokens) {
        uint ethValue = 0;

        if (exData.srcAddr == KYBER_ETH_ADDRESS) {
            ethValue = exData.srcAmount;
        }

        if (_type == ActionType.SELL) {
            swapedTokens = ExchangeInterfaceV2(_wrapper).
                    sell{value: ethValue}(exData.srcAddr, exData.destAddr, exData.srcAmount);
        } else {
            swapedTokens = ExchangeInterfaceV2(_wrapper).
                    buy{value: ethValue}(exData.srcAddr, exData.destAddr, exData.destAmount);
        }

    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}
}