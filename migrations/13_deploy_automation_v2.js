const AutomaticProxyV2 = artifacts.require("./AutomaticProxyV2.sol");
const MCDMonitorProxyV2 = artifacts.require("./MCDMonitorProxyV2.sol");
const MCDMonitorV2 = artifacts.require("./MCDMonitorV2.sol");
const SubscriptionsV2 = artifacts.require("./SubscriptionsV2.sol");
const SubscriptionsProxyV2 = artifacts.require("./SubscriptionsProxyV2.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        // No need to deploy this ever again, logger is at 0xAD32Ce09DE65971fFA8356d7eF0B783B82Fd1a9A

    	// FIRST STEP
    	// 1. comment second step
    	// 2. deploy first step if needed
    	// ------------------------------------------------------------------------------------------------------

        // await deployer.deploy(MCDMonitorProxyV2, 0, {gas: 5000000, overwrite: deployAgain});

        // ------------------------------------------------------------------------------------------------------


        // don't comment this, change to specific address if needed
        let monitorProxyAddress = (await MCDMonitorProxyV2.deployed()).address;


        // SECOND STEP
        // 1. change MonitorProxyAddress in SubscriptionProxyV2
        // 2. comment first step
        // 3. uncomment second step
        // 2. deploy these
        // ------------------------------------------------------------------------------------------------------

        await deployer.deploy(AutomaticProxyV2, {gas: 6700000, overwrite: deployAgain});
        let automaticProxyAddress = (await AutomaticProxyV2.deployed()).address;

        await deployer.deploy(SubscriptionsV2, automaticProxyAddress, {gas: 5000000, overwrite: deployAgain});
        let subscriptionsAddress = (await SubscriptionsV2.deployed()).address;

        await deployer.deploy(SubscriptionsProxyV2, {gas: 5000000, overwrite: deployAgain});
        let subscriptionsProxyAddress = (await SubscriptionsProxyV2.deployed()).address;

        await deployer.deploy(MCDMonitorV2, monitorProxyAddress, subscriptionsAddress, automaticProxyAddress, {gas: 6700000, overwrite: deployAgain});
        let monitorAddress = (await MCDMonitorV2.deployed()).address;

        let monitorProxyV2 = await MCDMonitorProxyV2.deployed();
        console.log('----changing monitor----');
        await monitorProxyV2.changeMonitor(monitorAddress);
        await monitorProxyV2.confirmNewMonitor();
        console.log('----monitor changed----');

        console.log('----adding callers----');
        let monitor = await MCDMonitorV2.deployed();
        await monitor.addCaller('0xAED662abcC4FA3314985E67Ea993CAD064a7F5cF');
        await monitor.addCaller('0xa5d330F6619d6bF892A5B87D80272e1607b3e34D');
        await monitor.addCaller('0x6c259ea1fCa0D1883e3FFFdDeb8a0719E1D7265f');
        console.log('----callers added----');

        console.log({automaticProxyAddress});
        console.log({subscriptionsAddress});
        console.log({subscriptionsProxyAddress});
        console.log({monitorAddress});

        // ------------------------------------------------------------------------------------------------------


        // always log monitorProxyAddress at the end
        console.log({monitorProxyAddress});

        // to verify all contracts
        // truffle run verify MCDMonitorProxyV2 AutomaticProxyV2 MCDMonitorV2 SubscriptionsV2 SubscriptionsProxyV2 --network mainnet
    });
};

