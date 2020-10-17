const Web3 = require('web3')

const Subscriptions = artifacts.require("./Subscriptions.sol");
const Executor = artifacts.require("./Executor.sol");
const Registry = artifacts.require("./Registry.sol");

const BotAuth = artifacts.require("./BotAuth.sol");
const ActionManagerProxy = artifacts.require("./ActionManagerProxy.sol");
const ActionExecutor = artifacts.require("./ActionExecutor.sol");
const SubscriptionProxy = artifacts.require("./SubscriptionProxy.sol");

const McdGenerate = artifacts.require("./McdGenerate.sol");
const McdPayback = artifacts.require("./McdPayback.sol");
const McdSupply = artifacts.require("./McdSupply.sol");
const McdWithdraw = artifacts.require("./McdWithdraw.sol");

const DfsSell = artifacts.require("./DfsSell.sol");
const FLTaker = artifacts.require("./FLTaker.sol");


const McdRatioTrigger = artifacts.require("./McdRatioTrigger.sol");

const DebugInfo = artifacts.require("./DebugInfo.sol");

module.exports = async (deployer, network, accounts) => {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    const web3 = new Web3(process.env.MOON_NET_NODE);

    // STEP 1 registry deploy
    // await deployer.deploy(Registry, {gas: 6720000, overwrite: deployAgain});


    const registryAddr = '0x2f111D6611D3a3d559992f39e3F05aC0385dCd5D';

    const registry = await Registry.at(registryAddr);

    // await deployer.deploy(DebugInfo, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(SubscriptionProxy, {gas: 6720000, overwrite: deployAgain});
    // const subscriptionProxyAddress = (await SubscriptionProxy.deployed()).address;

    // await deployer.deploy(Executor, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(Subscriptions, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(BotAuth, {gas: 6720000, overwrite: deployAgain});
    await deployer.deploy(ActionManagerProxy, {gas: 6720000, overwrite: deployAgain});
    await deployer.deploy(ActionExecutor, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(McdGenerate, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdPayback, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdSupply, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdWithdraw, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(McdRatioTrigger, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(DfsSell, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(FLTaker, {gas: 6720000, overwrite: deployAgain});

    // const botAuthAddress = (await BotAuth.deployed()).address;
    // const botAuth = await BotAuth.at(botAuthAddress);
    // await registry.addNewContract(web3.utils.keccak256('BotAuth'), botAuthAddress, 0);
    // await botAuth.addCaller(accounts[0]);

    // const subscriptionsAddress = (await Subscriptions.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('Subscriptions'), subscriptionsAddress, 0);

    const actionManagerProxyAddress = (await ActionManagerProxy.deployed()).address;
    await registry.changeInsant(web3.utils.keccak256('ActionManagerProxy'), actionManagerProxyAddress);

    const actionExecutorAddress = (await ActionExecutor.deployed()).address;
    await registry.changeInsant(web3.utils.keccak256('ActionExecutor'), actionExecutorAddress);

    // const mcdGenerateAddress = (await McdGenerate.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('McdGenerate'), mcdGenerateAddress, 0);

    // const mcdPaybackAddress = (await McdPayback.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('McdPayback'), mcdPaybackAddress, 0);

    // const mcdSupplyAddress = (await McdSupply.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('McdSupply'), mcdSupplyAddress, 0);

    // const dfsSellAddress = (await DfsSell.deployed()).address;
    // await registry.changeInsant(web3.utils.keccak256('DfsSell'), dfsSellAddress);

    // const flTakerAddress = (await FLTaker.deployed()).address;
    // await registry.changeInsant(web3.utils.keccak256('FLTaker'), flTakerAddress);

    // const mcdWithdrawAddress = (await McdWithdraw.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('McdWithdraw'), mcdWithdrawAddress, 0);

    // const mcdRatioTriggerAddress = (await McdRatioTrigger.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256('McdRatioTrigger'), mcdRatioTriggerAddress, 0);

    // console.log("subscription: ", (await Subscriptions.deployed()).address);
    // console.log("executor: ", (await Executor.deployed()).address);
    // console.log("subscriptionProxyAddress: ", subscriptionProxyAddress);

};
