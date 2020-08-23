const AaveLoanInfo = artifacts.require("./AaveLoanInfo.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        await deployer.deploy(AaveLoanInfo, {gas: 3500000, overwrite: deployAgain});
    });
};

