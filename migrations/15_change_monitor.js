const AutomaticProxyV2 = artifacts.require("./AutomaticProxyV2.sol");
const MCDMonitorProxyV2 = artifacts.require("./MCDMonitorProxyV2.sol");
const MCDMonitorV2 = artifacts.require("./MCDMonitorV2.sol");
const SubscriptionsV2 = artifacts.require("./SubscriptionsV2.sol");
const SubscriptionsProxyV2 = artifacts.require("./SubscriptionsProxyV2.sol");

require('dotenv').config();

module.exports = function(deployer, network, accounts) {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    deployer.then(async () => {

        let monitorProxyAddress = '0x47d9f61bADEc4378842d809077A5e87B9c996898';
        let subscriptionsAddress = '0xC45d4f6B6bf41b6EdAA58B01c4298B8d9078269a';
        let subscriptionsProxyAddress = '0xd6f2125bF7FE2bc793dE7685EA7DEd8bff3917DD';


        // FIRST STEP
        // 1. comment out second step
        // 2. run migration
        // ------------------------------------------------------------------------------------------------------

        // await deployer.deploy(AutomaticProxyV2, {gas: 6700000, overwrite: deployAgain});
        // let automaticProxyAddress = (await AutomaticProxyV2.deployed()).address;

        // await deployer.deploy(MCDMonitorV2, monitorProxyAddress, subscriptionsAddress, automaticProxyAddress, {gas: 6700000, overwrite: deployAgain});
        // let monitorAddress = (await MCDMonitorV2.deployed()).address;

        // console.log('-----adding callers----')
        // let monitor = await MCDMonitorV2.deployed();
        // await monitor.addCaller('0xAED662abcC4FA3314985E67Ea993CAD064a7F5cF');
        // await monitor.addCaller('0xa5d330F6619d6bF892A5B87D80272e1607b3e34D');
        // await monitor.addCaller('0x6c259ea1fCa0D1883e3FFFdDeb8a0719E1D7265f');
        // console.log('----callers added----');

        // console.log('----changing monitor----');
        // let monitorProxyV2 = await MCDMonitorProxyV2.at(monitorProxyAddress);
        // console.log('New monitor address:', monitorAddress, 'from:', accounts[0]);
        // await monitorProxyV2.changeMonitor(monitorAddress);
        // console.log('----monitor changed-----')


        // console.log({automaticProxyAddress});
        // console.log({monitorAddress});

        // ------------------------------------------------------------------------------------------------------


        // SECOND STEP
        // 1. comment out first step
        // 2. run migration
        // ------------------------------------------------------------------------------------------------------

        console.log('------confirming new monitor---------');
        let monitorProxyV2 = await MCDMonitorProxyV2.at(monitorProxyAddress);
        await monitorProxyV2.confirmNewMonitor();
        console.log('------new monitor confirmed----------');

        // ------------------------------------------------------------------------------------------------------


        // to verify all contracts
        // truffle run verify AutomaticProxyV2 MCDMonitorV2 --network mainnet
    });
};

