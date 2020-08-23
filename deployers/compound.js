// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const { deployContract } = require("./utils/deployer");
const { start } = require('./utils/starter');

async function main() {

  // await deployContract("CompoundSaverFlashProxy");
  // await deployContract("CompoundSaverFlashLoan");
  await deployContract("CompoundFlashLoanTaker");
}

start(main);