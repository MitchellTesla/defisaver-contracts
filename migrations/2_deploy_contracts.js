const SaverProxy = artifacts.require("./SaverProxy.sol");
const Monitor = artifacts.require("./Monitor.sol");
const MonitorProxy = artifacts.require("./MonitorProxy.sol");
const KyberWrapper = artifacts.require("./KyberWrapper.sol");
const UniswapWrapper = artifacts.require("./UniswapWrapper.sol");
const Eth2DaiWrapper = artifacts.require("./Eth2DaiWrapper.sol");
const Marketplace = artifacts.require("./Marketplace.sol");
const MarketplaceProxy = artifacts.require("./MarketplaceProxy.sol");
const CompoundProxy = artifacts.require("./CompoundProxy.sol");
const DecenterMonitorLending = artifacts.require("./DecenterMonitorLending.sol");
const Discount = artifacts.require("./Discount.sol");

require('dotenv').config();

module.exports = function(deployer, network) {
  let deployAgain = (process.env.DEPLOY_AGAIN === 'true') ? true : false;

  console.log(network);

  if (network == 'kovan-fork' || network == 'kovan') {
    //deployer.deploy(Eth2DaiWrapper, {gas: 6720000, overwrite: deployAgain});

    // deployer.deploy(Monitor, {gas: 6720000, overwrite: deployAgain});

    // Only marketplace deploy
    // deployer.deploy(MarketplaceProxy, {gas: 6720000, overwrite: deployAgain})
    // .then(() => {
    //   return deployer.deploy(Marketplace, MarketplaceProxy.address, {gas: 6720000, overwrite: deployAgain});
    // });

    deployer.deploy(Discount, {gas: 6720000, overwrite: true});

    // deployer.deploy(SaverProxy, {gas: 6720000, overwrite: deployAgain});

    //  deployer.deploy(Monitor, {gas: 6720000, overwrite: deployAgain}).then(() => {
    //     return deployer.deploy(DecenterMonitorLending, '0x93cdB0a93Fc36f6a53ED21eCf6305Ab80D06becA', Monitor.address, {gas: 6720000, overwrite: deployAgain});
    //   });

  } else if (network == 'rinkeby') {
    deployer.deploy(UniswapWrapper, {gas: 6720000, overwrite: deployAgain});
  } else {
    // deployer.deploy(Monitor, {gas: 6720000, overwrite: deployAgain});
    // deployer.deploy(CompoundProxy, {gas: 6720000, overwrite: deployAgain});

    // deployer.deploy(SaverProxy, {gas: 6720000, overwrite: deployAgain}).then(() => {
    //   return deployer.deploy(MarketplaceProxy, {gas: 6720000, overwrite: deployAgain});
    // }).then(() => {
    //   return deployer.deploy(Marketplace, MarketplaceProxy.address, {gas: 6720000, overwrite: deployAgain});
    // }).then(() => {
    //   return deployer.deploy(Monitor, SaverProxy.address, {gas: 6720000, overwrite: deployAgain});
    // });
  }
};
