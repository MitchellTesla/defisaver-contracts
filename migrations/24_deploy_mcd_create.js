const MCDCreateTaker = artifacts.require("./MCDCreateTaker.sol");
const MCDCreateFlashLoan = artifacts.require("./MCDCreateFlashLoan.sol");

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    // Step 1. Deploy this and change in contract code
    deployer.deploy(MCDCreateFlashLoan, {gas: 6720000, overwrite: deployAgain});

    // Step 2.
    deployer.deploy(MCDCreateTaker, {gas: 6720000, overwrite: deployAgain});
};
