let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');

const { wdiv, wmul, getBalance, approve, loadAccounts, getAccounts, getProxy, fetchMakerAddresses, saverExchangeAddress, ETH_ADDRESS, WETH_ADDRESS, nullAddress, transferToken, MAX_UINT } = require('./helper.js');

const Prices = contract.fromArtifact("Prices");

const pricesAddress = '0x359D1E0E6DE68e2960D9b3acF8385d07c33c9620';

const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const dai = '0x6b175474e89094c44da98b954eedeac495271d0f';
const wbtc = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

const sellToken = wbtc; //ETH_ADDRESS; //usdc; 
const buyToken = dai; //ETH_ADDRESS;
const value = '100000000'; // '1000000000000000000';//'1000000'; // '1000000'; // 

describe("ExchangePrices", accounts => {
    let prices;

    before(async () => {
        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        prices = new web3.eth.Contract(Prices.abi, pricesAddress);
    });

    it('... should check Oasis rates', async () => {
        const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  1, 0).call();
        const amountToBuy = wmul(value, sellRate['1']);
        console.log(sellRate['1']);
        console.log(amountToBuy.toFixed(0))

        const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 1, 1).call();
        const amountToPay = wdiv(value, buyRate['1']);
        console.log(buyRate['1']);
        console.log(amountToPay.toFixed(0));
    });

    it('... should Kyber rates', async () => {
        const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  2, 0).call();
        const amountToBuy = wmul(value, sellRate['1']);
        console.log(sellRate['1']);
        console.log(amountToBuy.toFixed(0)) 

        const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 2, 1).call();
        const amountToPay = wdiv(value, buyRate['1']);
        console.log(buyRate['1']);
        console.log(amountToPay.toFixed(0));
    });

    it('... should Uniswap rates', async () => {
        const sellRate = await prices.methods.getBestPrice(value, sellToken, buyToken,  3, 0).call();
        const amountToBuy = wmul(value, sellRate['1']);
        console.log(sellRate['1']);
        console.log(amountToBuy.toFixed(0))

        const buyRate = await prices.methods.getBestPrice(amountToBuy.toFixed(0), sellToken, buyToken, 3, 1).call();
        const amountToPay = wdiv(value, buyRate['1']);
        console.log(buyRate['1']);
        console.log(amountToPay.toFixed(0));
    });
});