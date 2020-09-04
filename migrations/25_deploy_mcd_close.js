const MCDCloseTaker = artifacts.require("./MCDCloseTaker.sol");
const MCDCloseFlashLoan = artifacts.require("./MCDCloseFlashLoan.sol");


module.exports = async (deployer, network, accounts) => {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    // Step 1. Deploy this and change in contract code
    // deployer.deploy(MCDCloseFlashLoan, {gas: 6720000, overwrite: deployAgain});

    // // Step 2.
    // deployer.deploy(MCDCloseTaker, {gas: 6720000, overwrite: deployAgain});


};
