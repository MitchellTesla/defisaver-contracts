const ProxyPermission = artifacts.require("./ProxyPermission.sol");
const SubscriptionsMigration = artifacts.require("./SubscriptionsMigration.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {
        await deployer.deploy(ProxyPermission, {gas: 3000000, overwrite: deployAgain});
        let deployAddress = (await ProxyPermission.deployed()).address;

        await deployer.deploy(SubscriptionsMigration, deployAddress, {gas: 3000000, overwrite: deployAgain});
    });
};

