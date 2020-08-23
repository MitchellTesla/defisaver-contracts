const CompoundLoanInfo = artifacts.require("./CompoundLoanInfo.sol");
const CompoundSaverHelper = artifacts.require("./CompoundSaverHelper.sol");


require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        // await deployer.deploy(CompoundLoanInfo, {gas: 3500000, overwrite: deployAgain});
        await deployer.deploy(CompoundSaverHelper, {gas: 3500000, overwrite: deployAgain});


    });
};
