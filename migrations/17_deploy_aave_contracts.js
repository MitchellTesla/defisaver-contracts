const AaveBasicProxy = artifacts.require("./AaveBasicProxy.sol");
const AaveSaverProxy = artifacts.require("./AaveSaverProxy.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {
        await deployer.deploy(AaveBasicProxy, {gas: 3000000, overwrite: deployAgain});
        await deployer.deploy(AaveSaverProxy, {gas: 5000000, overwrite: deployAgain});
    });
};

