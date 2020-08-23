const KyberWrapper = artifacts.require("./KyberWrapper.sol");
const UniswapWrapper = artifacts.require("./UniswapWrapper.sol");
const OasisTradeWrapper = artifacts.require("./OasisTradeWrapper.sol");
const SaverExchange = artifacts.require("./SaverExchange.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {
        // await deployer.deploy(OasisTradeWrapper, {gas: 6720000, overwrite: deployAgain});
        // await deployer.deploy(KyberWrapper, {gas: 6720000, overwrite: deployAgain});
        // await deployer.deploy(UniswapWrapper, {gas: 6720000, overwrite: deployAgain});

        await deployer.deploy(SaverExchange, {gas: 6720000, overwrite: deployAgain});
    });
};
