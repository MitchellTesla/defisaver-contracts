let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');

const { wdiv, wmul, getBalance, approve, loadAccounts, getAccounts, getProxy, fetchMakerAddresses, saverExchangeAddress, ETH_ADDRESS, WETH_ADDRESS, nullAddress, transferToken, MAX_UINT } = require('./helper.js');

const Prices = contract.fromArtifact("Prices");

const pricesAddress = '0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF';

const uniswapWrapperAddr = '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb';
const kyberWrapperAddr = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7';
const uniswapV2WrapperAddr = '0xf19A2A01B70519f67ADb309a994Ec8c69A967E8b';
const oasisTradeWrapperAddr = '0xA57B8a5584442B467b4689F1144D269d096A3daF';

const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const dai = '0x6b175474e89094c44da98b954eedeac495271d0f';
const wbtc = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

const sellToken = ETH_ADDRESS; //usdc;
const buyToken = dai; //ETH_ADDRESS;
const value = '100000000'; // '1000000000000000000';//'1000000'; // '1000000'; //

describe("ExchangePrices", accounts => {
    let prices;

    before(async () => {
        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        prices = new web3.eth.Contract(Prices.abi, pricesAddress);
    });

    it('... should check sell prices', async () => {
        const ethAmount = 500;
        console.log(`Selling ${ethAmount} eth`);

        const sellRateUni = await prices.methods.getExpectedRate(
            uniswapWrapperAddr, sellToken, buyToken,  ethAmount, 0).call();

        console.log('UNI V1: ', sellRateUni / 1e18);

        const sellRateUni2 = await prices.methods.getExpectedRate(
            uniswapV2WrapperAddr, sellToken, buyToken,  ethAmount, 0).call();

        console.log('UNI V2: ', sellRateUni2 / 1e18);

        const sellRateKyber = await prices.methods.getExpectedRate(
            kyberWrapperAddr, sellToken, buyToken,  ethAmount, 0).call();

        console.log('Kyber: ', sellRateKyber / 1e18);

        const sellRateOasis = await prices.methods.getExpectedRate(
            oasisTradeWrapperAddr, sellToken, buyToken,  ethAmount, 0).call();

        console.log('Oasis: ', sellRateOasis / 1e18);
    });


    it('... should check buy prices', async () => {
        const daiAmount = 10000;
        console.log(`Buying ${daiAmount} dai`);

        const buyRateUni = await prices.methods.getExpectedRate(
            uniswapWrapperAddr, sellToken, buyToken,  daiAmount, 1).call();

        console.log('UNI V1: ', buyRateUni / 1e18);

        const buyRateUni2 = await prices.methods.getExpectedRate(
            uniswapV2WrapperAddr, sellToken, buyToken,  daiAmount, 1).call();

        console.log('UNI V2: ', buyRateUni2 / 1e18);

        const buyRateKyber = await prices.methods.getExpectedRate(
            kyberWrapperAddr, sellToken, buyToken,  daiAmount, 1).call();

        console.log('Kyber: ', buyRateKyber / 1e18);

        const buyRateOasis = await prices.methods.getExpectedRate(
            oasisTradeWrapperAddr, sellToken, buyToken,  daiAmount, 1).call();

        console.log('Oasis: ', buyRateOasis / 1e18);
    });


    // it('... should check Oasis rates', async () => {
    //     const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  1, 0).call();
    //     const amountToBuy = wmul(value, sellRate['1']);
    //     console.log(sellRate['1']);
    //     console.log(amountToBuy.toFixed(0))

    //     const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 1, 1).call();
    //     const amountToPay = wdiv(value, buyRate['1']);
    //     console.log(buyRate['1']);
    //     console.log(amountToPay.toFixed(0));
    // });

    // it('... should Kyber rates', async () => {
    //     const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  2, 0).call();
    //     const amountToBuy = wmul(value, sellRate['1']);
    //     console.log(sellRate['1']);
    //     console.log(amountToBuy.toFixed(0))

    //     const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 2, 1).call();
    //     const amountToPay = wdiv(value, buyRate['1']);
    //     console.log(buyRate['1']);
    //     console.log(amountToPay.toFixed(0));
    // });

    // it('... should Uniswap rates', async () => {
    //     const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  3, 0).call();
    //     const amountToBuy = wmul(value, sellRate['1']);
    //     console.log(sellRate['1']);
    //     console.log(amountToBuy.toFixed(0))

    //     const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 3, 1).call();
    //     const amountToPay = wdiv(value, buyRate['1']);
    //     console.log(buyRate['1']);
    //     console.log(amountToPay.toFixed(0));
    // });

});
