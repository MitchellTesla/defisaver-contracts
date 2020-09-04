const KyberWrapper = artifacts.require("./KyberWrapper.sol");
const UniswapWrapper = artifacts.require("./UniswapWrapper.sol");
const UniswapV2Wrapper = artifacts.require("./UniswapV2Wrapper.sol");
const OasisTradeWrapper = artifacts.require("./OasisTradeWrapper.sol");
const SaverExchange = artifacts.require("./SaverExchange.sol");
const SaverExchangeRegistry = artifacts.require("./SaverExchangeRegistry.sol");
const AllowanceProxy = artifacts.require("./AllowanceProxy.sol");
const Prices = artifacts.require("./Prices.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    // needs to be set in tests and approved
    const allowanceAddr = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';

    // the same needs to be set in the contract
    const registryAddr = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';

    deployer.then(async () => {

        // await deployer.deploy(Prices, {gas: 6720000, overwrite: deployAgain});

        // Step 1. deploy allowance and add addres here and registry in contract
        // await deployer.deploy(AllowanceProxy, {gas: 6720000, overwrite: deployAgain});
        // await deployer.deploy(SaverExchangeRegistry, {gas: 6720000, overwrite: deployAgain});


        // Step 2
        const allowanceContract = await AllowanceProxy.at(allowanceAddr);

        await deployer.deploy(SaverExchange, {gas: 6720000, overwrite: deployAgain});
        const saverExchangeAddr = (await SaverExchange.deployed()).address;

        await allowanceContract.ownerChangeExchange(saverExchangeAddr);

        // deploy wrappers
        await deployer.deploy(UniswapWrapper, {gas: 6720000, overwrite: deployAgain});
        await deployer.deploy(KyberWrapper, {gas: 6720000, overwrite: deployAgain});
        await deployer.deploy(OasisTradeWrapper, {gas: 6720000, overwrite: deployAgain});
        await deployer.deploy(UniswapV2Wrapper, {gas: 6720000, overwrite: deployAgain});

        const registry = await SaverExchangeRegistry.at(registryAddr);

        const uniswapWrapperAddr = (await UniswapWrapper.deployed()).address;
        console.log('UniswapWrapper: ',uniswapWrapperAddr);
        await registry.addWrapper(uniswapWrapperAddr);

        const kyberWrapperAddr = (await KyberWrapper.deployed()).address;
        console.log('KyberWrapper: ',kyberWrapperAddr);
        await registry.addWrapper(kyberWrapperAddr);

        const oasisTradeWrapperAddr = (await OasisTradeWrapper.deployed()).address;
        console.log('OasisTradeWrapper: ',oasisTradeWrapperAddr);
        await registry.addWrapper(oasisTradeWrapperAddr);

        const uniswapV2WrapperAddr = (await UniswapV2Wrapper.deployed()).address;
        console.log('UniswapV2WrapperAddr: ',uniswapV2WrapperAddr);
        await registry.addWrapper(uniswapV2WrapperAddr);
    });
};
