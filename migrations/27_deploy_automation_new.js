const Web3 = require('web3')

const Subscriptions = artifacts.require("./Subscriptions.sol");
const Executor = artifacts.require("./Executor.sol");
const Registry = artifacts.require("./Registry.sol");

const BotAuth = artifacts.require("./BotAuth.sol");
const ActionManagerProxy = artifacts.require("./ActionManagerProxy.sol");
const ActionExecutor = artifacts.require("./ActionExecutor.sol");

module.exports = async (deployer, network, accounts) => {
    let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

    const web3 = new Web3(process.env.MOON_NET_NODE);

    // Step 1. Deploy first this and change in code and registryAddr here
    // await deployer.deploy(Registry, {gas: 6720000, overwrite: deployAgain});
    // await deployer.deploy(Subscriptions, {gas: 6720000, overwrite: deployAgain});

    // // Step 2.

    const registryAddr = '0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb';

    await deployer.deploy(Executor, {gas: 6720000, overwrite: deployAgain});
    const executorAddress = (await Executor.deployed()).address;

    await deployer.deploy(BotAuth, {gas: 6720000, overwrite: deployAgain});
    await deployer.deploy(ActionManagerProxy, {gas: 6720000, overwrite: deployAgain});
    await deployer.deploy(ActionExecutor, {gas: 6720000, overwrite: deployAgain});

    const registry = await Registry.at(registryAddr);

    const botAuthAddress = (await BotAuth.deployed()).address;
    await registry.addNewContract(web3.utils.keccak256(botAuthAddress), botAuthAddress, 0);

    const actionManagerProxyAddress = (await ActionManagerProxy.deployed()).address;
    await registry.addNewContract(web3.utils.keccak256(actionManagerProxyAddress), actionManagerProxyAddress, 0);

    const actionExecutorAddress = (await ActionExecutor.deployed()).address;
    await registry.addNewContract(web3.utils.keccak256(actionExecutorAddress), actionExecutorAddress, 0);

    console.log("Executor: ", executorAddress);
    console.log("botAuthAddress: ", botAuthAddress);
    console.log("actionManagerProxyAddress: ", actionManagerProxyAddress);
    console.log("actionExecutorAddress: ", actionExecutorAddress);
};
