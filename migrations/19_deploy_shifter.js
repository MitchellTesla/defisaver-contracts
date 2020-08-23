const CompShifter = artifacts.require("./CompShifter.sol");
const McdShifter = artifacts.require("./McdShifter.sol");

const LoanShifterTaker = artifacts.require("./LoanShifterTaker.sol");
const LoanShifterReceiver = artifacts.require("./LoanShifterReceiver.sol");

const ShifterRegistry = artifacts.require("./ShifterRegistry.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        // STEP 1 (zameni u kodu novu adresu)
        // await deployer.deploy(ShifterRegistry, {gas: 5000000, overwrite: deployAgain});


        // STEP 2 (ubaci ovde registry adresu)
        await deployer.deploy(LoanShifterTaker, {gas: 5000000, overwrite: deployAgain});
        await deployer.deploy(LoanShifterReceiver, {gas: 5000000, overwrite: deployAgain});
        await deployer.deploy(CompShifter, {gas: 5000000, overwrite: deployAgain});
        await deployer.deploy(McdShifter, {gas: 6700000, overwrite: deployAgain});

        const loanShifterReceiverAddress = (await LoanShifterReceiver.deployed()).address;
        const compShifterAddress = (await CompShifter.deployed()).address;
        const mcdShifterAddress = (await McdShifter.deployed()).address;

        console.log('loanShifterReceiverAddress', loanShifterReceiverAddress);
        console.log('compShifterAddress', compShifterAddress);
        console.log('mcdShifterAddress', mcdShifterAddress);

        const registry = await ShifterRegistry.at('0x988B6CFBf3332FF98FFBdED665b1F53a61f92612');
        await registry.changeContractAddr('MCD_SHIFTER', mcdShifterAddress);
        await registry.changeContractAddr('COMP_SHIFTER', compShifterAddress);
        await registry.changeContractAddr('LOAN_SHIFTER_RECEIVER', loanShifterReceiverAddress);

        const loanShifterTakerAddr = (await LoanShifterTaker.deployed()).address;
        console.log('loanShifterTakerAddr: ', loanShifterTakerAddr);

    });
};

