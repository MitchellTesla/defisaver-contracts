// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const { deployContract } = require("./utils/deployer");
const { start } = require('./utils/starter');

async function main() {
 	const exchange = await deployContract("SaverExchange");

 	const AllowanceProxy = await ethers.getContractFactory("AllowanceProxy");
  	const exchangeAllowance = await AllowanceProxy.attach('0xdd8e19f63844e433c80117b402e36b62eff3ec0a');
 	
 	console.log('Set exchange address in AllowanceProxy');
 	await exchangeAllowance.ownerChangeExchange(exchange.address);
}

start(main);
