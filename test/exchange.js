let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');

const { getBalance, approve, loadAccounts, getAccounts, getProxy, fetchMakerAddresses, saverExchangeAddress, ETH_ADDRESS, WETH_ADDRESS, nullAddress, transferToken, MAX_UINT } = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const SaverExchange = contract.fromArtifact('SaverExchange');
const ExchangeInterfaceV2 = contract.fromArtifact('ExchangeInterfaceV2');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const AllowanceProxy = contract.fromArtifact('AllowanceProxy');
const Prices = contract.fromArtifact('Prices');

const makerVersion = "1.0.6";

// UniswapWrapper:  0xC89Ce4735882C9F0f0FE26686c53074E09B0D550
// KyberWrapper:  0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb
// OasisTradeWrapper:  0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7
// UniswapV2WrapperAddr:  0xe982E462b094850F12AF94d21D470e21bE9D0E9C

const wrapperAddress = '0x4339316e04CFfB5961D1c41fEF8E44bfA2A7fBd1';
const allowanceProxyAddress = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';
const pricesAddress = '0xC045C7B6B976d24728872d2117073c893d0B09C2';

let tokenName = "MCD_DAI"; // ["MCD_DAI", "BAT", "USCD", "WBTC"]

describe("Exchange2", accounts => {
    let registry, proxy, proxyAddr, makerAddresses, exchange, web3Exchange, web3OasisWrapper;

    before(async () => {
    	makerAddresses = await fetchMakerAddresses(makerVersion);

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        registry = await ProxyRegistryInterface.at(makerAddresses["PROXY_REGISTRY"]);

        const proxyInfo = await getProxy(registry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
        prices = new web3.eth.Contract(Prices.abi, pricesAddress);

        exchange = await SaverExchange.at(saverExchangeAddress);
        web3Exchange = new web3.eth.Contract(SaverExchange.abi, saverExchangeAddress);
        allowanceProxy = new web3.eth.Contract(AllowanceProxy.abi, allowanceProxyAddress);
    });


    it(`... should sell Ether for ${tokenName}`, async () => {
        const value = web3.utils.toWei('10', 'ether');

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        const ethBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);

        console.log(ethBalanceBefore.toString());

        await allowanceProxy.methods.callSell(
            [ETH_ADDRESS, makerAddresses[tokenName], value, 0, 0, wrapperAddress, nullAddress, "0x0", 0]).send({from: accounts[0], value, gas: 3000000});

        const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses[tokenName]);

        expect(daiBalanceAfter).to.be.bignumber.is.above(daiBalanceBefore);
    });

    it(`... should sell ${tokenName} for Ether`, async () => {
        const value = web3.utils.toWei('10', 'ether');

        await approve(web3, makerAddresses[tokenName], accounts[0], allowanceProxyAddress);

        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('ETH balance: ', etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceBefore/1e18);

        await allowanceProxy.methods.callSell(
            [makerAddresses[tokenName], ETH_ADDRESS, value, 0, 0, wrapperAddress, nullAddress, "0x0", 0]).send({from: accounts[0], value: 0, gas: 5000000});

        const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceAfter/1e18);

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('ETH balance: ', etherBalanceAfter/1e18);

        expect(etherBalanceAfter).to.be.bignumber.is.above(etherBalanceBefore);
    });

    it(`... should buy Ether with ${tokenName}`, async () => {
        const srcAmount = web3.utils.toWei('500', 'ether');
        const destAmount = web3.utils.toWei('0.5', 'ether');

        await approve(web3, makerAddresses[tokenName], accounts[0], allowanceProxyAddress);
        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ',etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceBefore/1e18);

        await allowanceProxy.methods.callBuy(
            [makerAddresses[tokenName], ETH_ADDRESS, srcAmount, destAmount,
             MAX_UINT, wrapperAddress, nullAddress, "0x0", 0])
             .send({from: accounts[0], gas: 5000000});

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ', etherBalanceAfter/1e18);

        const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceAfter/1e18);

        expect(etherBalanceAfter).to.be.bignumber.is.above(etherBalanceBefore);
    });

    it(`... should buy ${tokenName} with Eth`, async () => {
        const value = web3.utils.toWei('1', 'ether');
        const destAmount = web3.utils.toWei('100', 'ether');

        const etherBalanceBefore = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ',etherBalanceBefore/1e18);

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceBefore/1e18);

        await allowanceProxy.methods.callBuy(
            [ETH_ADDRESS, makerAddresses[tokenName], value, destAmount,
             MAX_UINT, wrapperAddress, nullAddress, "0x0", 0])
             .send({from: accounts[0], value, gas: 5000000});

        const etherBalanceAfter = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log('Eth balance: ', etherBalanceAfter/1e18);

        const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses[tokenName]);
        console.log(`${tokenName} balance: `, daiBalanceAfter/1e18);

        expect(daiBalanceAfter).to.be.bignumber.is.above(daiBalanceBefore);
    });

});
