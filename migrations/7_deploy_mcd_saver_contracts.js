const MCDSaverTaker = artifacts.require("./MCDSaverTaker.sol");
const MCDSaverFlashLoan = artifacts.require("./MCDSaverFlashLoan.sol");


module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    // Step 1. Deploy this and change in contract code
    deployer.deploy(MCDSaverFlashLoan, {gas: 6720000, overwrite: deployAgain});

    // Step 2.
    deployer.deploy(MCDSaverTaker, {gas: 6720000, overwrite: deployAgain});
};
