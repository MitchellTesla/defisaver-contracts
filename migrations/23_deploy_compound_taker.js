const CompoundFlashLoanTaker = artifacts.require("./CompoundFlashLoanTaker.sol");
const CompoundSaverFlashLoan = artifacts.require("./CompoundSaverFlashLoan.sol");
const CompoundSaverFlashProxy = artifacts.require("./CompoundSaverFlashProxy.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        await deployer.deploy(CompoundSaverFlashProxy, {gas: 3500000, overwrite: deployAgain});
    	// await deployer.deploy(CompoundSaverFlashLoan, {gas: 2000000, overwrite: deployAgain});
        // await deployer.deploy(CompoundFlashLoanTaker, {gas: 7000000, overwrite: deployAgain});
    });
};

