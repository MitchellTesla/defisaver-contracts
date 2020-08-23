let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const AaveBasicProxy = contract.fromArtifact("AaveBasicProxy");
const AaveSaverProxy = contract.fromArtifact("AaveSaverProxy");
const ERC20 = contract.fromArtifact("ERC20");
const ILendingPool = contract.fromArtifact("ILendingPool");
const IPriceOracleGetterAave = contract.fromArtifact("IPriceOracleGetterAave");

const { expect } = require('chai');

const { getAbiFunction, loadAccounts, getAccounts, getProxy, getBalance, approve, fetchMakerAddresses, nullAddress } = require('./helper.js');

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const AETH_ADDRESS = '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04';
const ADAI_ADDRESS = '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d';

const aaveBasicProxyAddr = "0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66";
const aaveSaverProxyAddr = "0xA94B7f0465E98609391C623d0560C5720a3f2D33";

const makerVersion = "1.0.6";

describe("AaveSaver", () => {

    let registry, proxy, proxyAddr, aaveBasicProxy, makerAddresses, web3proxy;

    let accounts;

    before(async () => {

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);
        makerAddresses = await fetchMakerAddresses(makerVersion);

        registry = await ProxyRegistryInterface.at("0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4");
        aaveBasicProxy = await AaveBasicProxy.at(aaveBasicProxyAddr);
        aaveSaverProxy = new web3.eth.Contract(AaveSaverProxy.abi, aaveSaverProxyAddr);
        lendingPool = new web3.eth.Contract(ILendingPool.abi, "0x398eC7346DcD622eDc5ae82352F02bE94C62d119");
        priceOracle = new web3.eth.Contract(IPriceOracleGetterAave.abi, "0x76B47460d7F7c5222cFb6b6A75615ab10895DDe4")

        const proxyInfo = await getProxy(registry, accounts[0], web3);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        web3proxy = proxyInfo.web3proxy;
    });

    it('...should be able to fetch users position', async () => {
        const position = await lendingPool.methods.getUserAccountData(proxyAddr).call();

        console.log(position);
    });

    it('...should be able to deposit and boost dai to eth', async () => {
        const amount = web3.utils.toWei('2', 'ether');

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveBasicProxy, 'deposit'),
          [ETH_ADDRESS, amount]);

        let value = amount;

        const receipt = await proxy.methods['execute(address,bytes)'](aaveBasicProxyAddr, data, {
            from: accounts[0], value});

        console.log('2 eth deposited');

        // address srcAddr;
        // address destAddr;
        // uint srcAmount;
        // uint destAmount;
        // uint minPrice;
        // ExchangeType exchangeType;
        // address exchangeAddr;
        // bytes callData;
        // uint256 price0x;

        const exchangeData = [makerAddresses["MCD_DAI"], ETH_ADDRESS, web3.utils.toWei('100', 'ether'), '0', '0', 0, nullAddress, '0x00', '0'];
        const gasCost = 0;
        const boostData = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveSaverProxy, 'boost'),
          [exchangeData, gasCost]);        

        const boostReceipt = await proxy.methods['execute(address,bytes)'](aaveSaverProxyAddr, boostData, {
            from: accounts[0], gas: 6000000});

        console.log(boostReceipt);
    });

    it('...should be able to fetch users position', async () => {
        const position = await lendingPool.methods.getUserAccountData(proxyAddr).call();

        console.log(position);
    });

    it('...should be able to repay eth to dai', async () => {
        const amount = web3.utils.toWei('0.3', 'ether');

        // address srcAddr;
        // address destAddr;
        // uint srcAmount;
        // uint destAmount;
        // uint minPrice;
        // ExchangeType exchangeType;
        // address exchangeAddr;
        // bytes callData;
        // uint256 price0x;

        const exchangeData = [ETH_ADDRESS, makerAddresses["MCD_DAI"], amount, '0', '0', 0, nullAddress, '0x00', '0'];
        const gasCost = 0;
        const repayData = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveSaverProxy, 'repay'),
          [exchangeData, gasCost]);        

        const repayReceipt = await proxy.methods['execute(address,bytes)'](aaveSaverProxyAddr, repayData, {
            from: accounts[0], gas: 6000000});

        console.log(repayReceipt);
    });

    it('...should be able to fetch users position', async () => {
        const position = await lendingPool.methods.getUserAccountData(proxyAddr).call();

        console.log(position);
    });
});
