// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { deployContract } = require("./utils/deployer");
const { start } = require('./utils/starter');

async function main() {
 	// const subscriptions = await deployContract("AaveSubscriptions");
 	// const monitorProxy = await deployContract("AaveMonitorProxy", 0);

 	// await deployContract("AaveMonitor", monitorProxy.address, subscriptions.address, "0x0f2642C8df509EB4e6fD9d2Ac65C3C8C8bF0797c")

 	await deployContract("AaveSubscriptionsProxy");
}

start(main);
