// to start with
// 1. ZrxAllowlist and SaverExchangeRegistry always returns true
// 2. change ZrxAllowlist, ZrxErc20Proxy and SaverExchangeRegistry to kovan in SaverExchangeHelper
// 3. change DefisaverLogger to kovan in SaverExchange
// 4. change WETH_ADDRESS to kovan in SaverExchangeHelper
// 5. helper.js change loadAccounts to use kovan address
// 6. remove discount from SaverExchange
// allowanceProxy = 0x2f82d342104D98782625D0896768352985480072
// saverExchange = 0xf629ED4E9905fA996BAC629E1fE2EF7A5B4F29cf

let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');
const axios = require('axios');

const { getBalance, approve, loadAccounts, getAccounts, getProxy, fetchMakerAddresses, saverExchangeAddress, ETH_ADDRESS, WETH_ADDRESS, nullAddress, transferToken, MAX_UINT } = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const SaverExchange = contract.fromArtifact('SaverExchange');
const ExchangeInterfaceV2 = contract.fromArtifact('ExchangeInterfaceV2');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const AllowanceProxy = contract.fromArtifact('AllowanceProxy');

const wrapperAddress = nullAddress;
const allowanceProxyAddress = '0x2f82d342104D98782625D0896768352985480072';

let tokenAddress = "0x2002D3812F58e35F0EA1fFbf80A75a38c32175fA"; // zerox token

const getOrder = async (sellToken, buyToken, amount, sell = true) => {
    const API_URL = 'https://kovan.api.0x.org/swap/v0/';

	let url = `${API_URL}quote?sellToken=${sellToken}&buyToken=${buyToken}`;
    url += sell ? `&sellAmount=${amount}` : `&buyAmount=${amount}`
    let res;

    try {
        res = await axios.get(
          url,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
    } catch (e) {
        console.log(e);
        return {
            to: nullAddress,
            data: '0x0',
            value: '0',
            price: '0'
        }
    }

    return res.data;
}


describe("ExchangeZerox", accounts => {
    let registry, proxy, proxyAddr, makerAddresses, exchange, web3OasisWrapper;

    before(async () => {
        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        allowanceProxy = new web3.eth.Contract(AllowanceProxy.abi, allowanceProxyAddress);
    });

    it(`... should sell Ether for ZRX`, async () => {
        const value = web3.utils.toWei('0.5', 'ether');

        const daiBalanceBefore = await getBalance(web3, accounts[0], tokenAddress);
        const ethBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);

        console.log(ethBalanceBefore.toString());

        const data = await getOrder('WETH', 'ZRX', value);

        console.log(data);

        await allowanceProxy.methods.callSell(
            [ETH_ADDRESS, tokenAddress, value, 0, 0, wrapperAddress, data.to, data.data, web3.utils.toWei(data.price)]).send({from: accounts[0], value: Dec(data.value).add(value).toString(), gas: 3000000});

        const daiBalanceAfter = await getBalance(web3, accounts[0], tokenAddress);

        expect(daiBalanceAfter).to.be.bignumber.is.above(daiBalanceBefore);
    });

    it(`... should sell ZRX for Ether`, async () => {
        const value = web3.utils.toWei('10', 'ether');

        await approve(web3, tokenAddress, accounts[0], allowanceProxyAddress);

        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('ETH balance: ', etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceBefore/1e18);

        const data = await getOrder('ZRX', 'WETH', value);

        await allowanceProxy.methods.callSell(
            [tokenAddress, ETH_ADDRESS, value, 0, 0, wrapperAddress, data.to, data.data, web3.utils.toWei(data.price)]).send({from: accounts[0], value: data.value, gas: 5000000});

        const daiBalanceAfter = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceAfter/1e18);

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('ETH balance: ', etherBalanceAfter/1e18);

        expect(etherBalanceAfter).to.be.bignumber.is.above(etherBalanceBefore);
    });

    it(`... should buy Ether with ZRX`, async () => {
        const srcAmount = web3.utils.toWei('350', 'ether');
        const destAmount = web3.utils.toWei('0.3', 'ether');

        await approve(web3, tokenAddress, accounts[0], allowanceProxyAddress);
        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ',etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceBefore/1e18);

        const data = await getOrder('ZRX', 'WETH', destAmount, false);

        await allowanceProxy.methods.callBuy(
            [tokenAddress, ETH_ADDRESS, srcAmount, destAmount,
             MAX_UINT, wrapperAddress, data.to, data.data, web3.utils.toWei(data.price)])
             .send({from: accounts[0], value: data.value, gas: 5000000});

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ', etherBalanceAfter/1e18);

        const daiBalanceAfter = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceAfter/1e18);

        expect(etherBalanceAfter).to.be.bignumber.is.above(etherBalanceBefore);
    });

    it(`... should buy ZRX with Eth`, async () => {
        const value = web3.utils.toWei('1', 'ether');
        const destAmount = web3.utils.toWei('100', 'ether');

        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ',etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceBefore/1e18);

        const data = await getOrder('WETH', 'ZRX', destAmount, false);

        await allowanceProxy.methods.callBuy(
            [ETH_ADDRESS, tokenAddress, value, destAmount,
             MAX_UINT, wrapperAddress, data.to, data.data, web3.utils.toWei(data.price)])
             .send({from: accounts[0], value: Dec(value).add(data.value).toString(), gas: 5000000});

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ', etherBalanceAfter/1e18);

        const daiBalanceAfter = await getBalance(web3, accounts[0], tokenAddress);
        console.log(`ZRX balance: `, daiBalanceAfter/1e18);

        expect(daiBalanceAfter).to.be.bignumber.is.above(daiBalanceBefore);
    });

});
