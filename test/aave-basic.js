let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const AaveBasicProxy = contract.fromArtifact("AaveBasicProxy");
const ERC20 = contract.fromArtifact("ERC20");

const { expect } = require('chai');

const { getAbiFunction, loadAccounts, getAccounts, getProxy, getBalance, approve, fetchMakerAddresses } = require('./helper.js');

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const AETH_ADDRESS = '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04';
const ADAI_ADDRESS = '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d';

const aaveBasicProxyAddr = "0x59d3631c86BbE35EF041872d502F218A39FBa150";

const makerVersion = "1.0.6";

describe("AaveBasic", () => {

    let registry, proxy, proxyAddr, aaveBasicProxy, makerAddresses;

    let accounts;

    before(async () => {

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);
        makerAddresses = await fetchMakerAddresses(makerVersion);

        registry = await ProxyRegistryInterface.at("0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4");
        aaveBasicProxy = await AaveBasicProxy.at(aaveBasicProxyAddr);

        const proxyInfo = await getProxy(registry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
    });

    it('...should deposit 2 Eth into Aave through proxy and enter the market', async () => {
        const amount = web3.utils.toWei('2', 'ether');

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveBasicProxy, 'deposit'),
          [ETH_ADDRESS, amount]);

        let value = amount;

        const receipt = await proxy.methods['execute(address,bytes)'](aaveBasicProxyAddr, data, {
            from: accounts[0], value});

        const aethBalanceAfter = await getBalance(web3, proxyAddr, AETH_ADDRESS);
        console.log("AEth balance:", aethBalanceAfter.toString());
    });

    it('...should withdraw 0.5 Eth from Aave through proxy', async () => {
        const amount = web3.utils.toWei('0.5', 'ether');

        await approve(web3, AETH_ADDRESS, accounts[0], proxyAddr);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveBasicProxy, 'withdraw'),
          [ETH_ADDRESS, AETH_ADDRESS, amount, false]);

        const receipt = await proxy.methods['execute(address,bytes)'](aaveBasicProxyAddr, data, {
            from: accounts[0]});

        const aethBalanceAfter = await getBalance(web3, proxyAddr, AETH_ADDRESS);
        console.log("AEth balance:", aethBalanceAfter.toString());
    });

    it('...should borrow 50 DAI from Aave through proxy', async () => {
        const amount = web3.utils.toWei('50', 'ether');

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log("DAI balance before:", daiBalanceBefore.toString());

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveBasicProxy, 'borrow'),
          [makerAddresses["MCD_DAI"], amount]);

        const receipt = await proxy.methods['execute(address,bytes)'](aaveBasicProxyAddr, data, {
            from: accounts[0]});

        const daiBalance = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log("DAI balance after:", daiBalance.toString());
    });

    it('...should payback 50 DAI to Aave through proxy', async () => {
        const amount = web3.utils.toWei('50', 'ether');

        await approve(web3, makerAddresses["MCD_DAI"], accounts[0], proxyAddr, amount);

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log("DAI balance before:", daiBalanceBefore.toString());

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveBasicProxy, 'payback'),
          [makerAddresses["MCD_DAI"], ADAI_ADDRESS, amount, false]);

        const receipt = await proxy.methods['execute(address,bytes)'](aaveBasicProxyAddr, data, {
            from: accounts[0]});

        const daiBalance = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log("DAI balance after:", daiBalance.toString());
    });
});
