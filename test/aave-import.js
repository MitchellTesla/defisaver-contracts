let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const AaveBasicProxy = contract.fromArtifact("AaveBasicProxy");
const ERC20 = contract.fromArtifact("ERC20");
const AaveImportTaker = contract.fromArtifact("AaveImportTaker");

const { expect } = require('chai');

const { getAbiFunction, loadAccounts, getAccounts, getProxy, getBalance, approve, fetchMakerAddresses, transferToken, fundIfNeeded } = require('./helper.js');

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const AETH_ADDRESS = '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04';
const ADAI_ADDRESS = '0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const aaveBasicProxyAddr = "0x9D266997bc73B27d4302E711b55FD78B5278e1De";
const aaveImportTakerAddr = "0x6b619F5eC6703eE1Ee85aCF58158561edF65aE97";
const aaveImportAddr = '0x207754BD0044BAd0C7021ca06643C26d59d8AD8f';

const makerVersion = "1.0.6";

describe("AaveImport", () => {

    let registry, proxy, proxyAddr, aaveBasicProxy, makerAddresses;

    let accounts;

    before(async () => {

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);
        makerAddresses = await fetchMakerAddresses(makerVersion);

        registry = await ProxyRegistryInterface.at("0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4");
        web3registry = new web3.eth.Contract(ProxyRegistryInterface.abi, "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4");
        aaveBasicProxy = await AaveBasicProxy.at(aaveBasicProxyAddr);
        aaveImportTaker = new web3.eth.Contract(AaveImportTaker.abi, aaveImportTakerAddr);

        // const proxyInfo = await getProxy(registry, accounts[0]);
        proxyAddr = await web3registry.methods.proxies(accounts[0]).call();
        proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);

        console.log(proxyAddr);
    });

    it('...should import loan from acc to proxy', async () => {
        const userEthDeposited = await getBalance(web3, proxyAddr, AETH_ADDRESS);
        console.log(userEthDeposited.toString());

        await fundIfNeeded(web3, accounts[0], aaveImportAddr, minBal='0.1', addBal='0.1');

        const wethBalance = await getBalance(web3, aaveImportAddr, WETH_ADDRESS);
        console.log('weth', wethBalance.toString());

        console.log('approved');
        await approve(web3, AETH_ADDRESS, accounts[0], aaveImportAddr, web3.utils.toWei('100000'));

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(AaveImportTaker, 'importLoan'),
          [ETH_ADDRESS, usdc, web3.utils.toWei('10')]);
        const tx = await proxy.methods['execute(address,bytes)'](aaveImportTakerAddr, data).send({
           from: accounts[0], gasPrice: 1000000000, gas: 3500000 });

        console.log('imported');

        // get proxy position
        const proxyEthDeposited = await getBalance(web3, accounts[0], AETH_ADDRESS);
        console.log(proxyEthDeposited.toString());
    });

});
