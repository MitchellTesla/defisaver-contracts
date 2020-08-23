// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const { deployContract } = require("./utils/deployer");
const { start } = require('./utils/starter');

async function main() {

  // before running, change CompoundSubscriptionsProxy.sol
  // before running, change these addresses below

  const compoundMonitorProxyAddress = '0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66';
  const subscriptionsAddress = '0x67B5656d60a809915323Bf2C40A8bEF15A152e3e';
  const compoundFlashLoanTakerAddress = '0x1c214eCB456D0D4403984E5593BE7992CF8B9eB8';

  // We get the contract to deploy
  await deploy("CompoundSubscriptionsProxy");
  const monitor = await deployContract("CompoundMonitor", compoundMonitorProxyAddress, subscriptionsAddress, compoundFlashLoanTakerAddress);

  const CompoundMonitorProxy = await ethers.getContractFactory("CompoundMonitorProxy");
  const monitorProxy = await CompoundMonitorProxy.attach(compoundMonitorProxyAddress);

  console.log('setting monitor');
  await monitorProxy.setMonitor(monitor.address);
  console.log('adding caller');
  await monitor.addCaller('0x6c259ea1fCa0D1883e3FFFdDeb8a0719E1D7265f');
}

start(main);