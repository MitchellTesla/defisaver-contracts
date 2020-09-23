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

module.exports = async (deployer, network, accounts) => {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    const web3 = new Web3(process.env.MOON_NET_NODE);

    // Step 1. Deploy first this and change in code and registryAddr here
    // await deployer.deploy(Registry, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(Subscriptions, {gas: 6720000, overwrite: deployAgain});

    // // Step 2.

    // const registryAddr = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';

    // await deployer.deploy(Executor, {gas: 6720000, overwrite: deployAgain});
    // const executorAddress = (await Executor.deployed()).address;

    // await deployer.deploy(BotAuth, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(ActionManagerProxy, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(ActionExecutor, {gas: 6720000, overwrite: deployAgain});

    // await deployer.deploy(McdGenerate, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdPayback, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdSupply, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(McdWithdraw, {gas: 6720000, overwrite: deployAgain});

    // const registry = await Registry.at(registryAddr);

    // const botAuthAddress = (await BotAuth.deployed()).address;
    // const botAuth = await BotAuth.at(botAuthAddress);
    // await registry.addNewContract(web3.utils.keccak256(botAuthAddress), botAuthAddress, 0);
    // await botAuth.addCaller(accounts[0]);

    // const actionManagerProxyAddress = (await ActionManagerProxy.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(actionManagerProxyAddress), actionManagerProxyAddress, 0);

    // const actionExecutorAddress = (await ActionExecutor.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(actionExecutorAddress), actionExecutorAddress, 0);

    // const mcdGenerateAddress = (await McdGenerate.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(mcdGenerateAddress), mcdGenerateAddress, 0);

    // const mcdPaybackAddress = (await McdPayback.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(mcdPaybackAddress), mcdPaybackAddress, 0);

    // const mcdSupplyAddress = (await McdSupply.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(mcdSupplyAddress), mcdSupplyAddress, 0);

    // const mcdWithdrawAddress = (await McdWithdraw.deployed()).address;
    // await registry.addNewContract(web3.utils.keccak256(mcdWithdrawAddress), mcdWithdrawAddress, 0);

    // console.log("Executor: ", executorAddress);

    // Step 3 - set Executor in SubscriptionProxy

    await deployer.deploy(SubscriptionProxy, {gas: 6720000, overwrite: deployAgain});
    const subscriptionProxyAddress = (await SubscriptionProxy.deployed()).address;

    console.log("subscriptionProxyAddress: ", subscriptionProxyAddress);


};
