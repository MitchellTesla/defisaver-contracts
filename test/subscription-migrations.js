let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');

const { getBalance, approve, loadAccounts, getAccounts, getProxy, fetchMakerAddresses, saverExchangeAddress, ETH_ADDRESS, nullAddress, fundIfNeeded } = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const SubscriptionMigrations = contract.fromArtifact("SubscriptionsMigration");
const MonitorProxyV1 = contract.fromArtifact("MCDMonitorProxy");
const OldSubscription = contract.fromArtifact("Subscriptions");

const makerVersion = "1.0.6";

function chunk (arr, len) {

  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}

function removeZeroElements(arr) {
    var i = arr.length;
    while (i--) {
        // 134 is moved to Instadapp
        if (arr[i].cdpId === '0' || arr[i].cdpId === '134') {
            arr.splice(i, 1);
        }
    }
    return arr;
}

describe("SubscriptionMigrations", accounts => {
    let registry, proxy, proxyAddr, makerAddresses, exchange, web3Exchange;

    before(async () => {
    	makerAddresses = await fetchMakerAddresses(makerVersion);
        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);
        registry = await ProxyRegistryInterface.at(makerAddresses["PROXY_REGISTRY"]);

        const proxyInfo = await getProxy(registry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
    });

    it('... migrate all subscriptions', async () => {
        const account = web3.eth.accounts.privateKeyToAccount('0x'+process.env.PRIV_KEY_BOT);
        web3.eth.accounts.wallet.add(account);

        await fundIfNeeded(web3, accounts[0], account.address);

        const subscriptionMigrations = await SubscriptionMigrations.new({from: accounts[0]});
        const web3SubscriptionMigraitons = new web3.eth.Contract(SubscriptionMigrations.abi, subscriptionMigrations.address);
        const web3MonitorProxy = new web3.eth.Contract(MonitorProxyV1.abi, '0x93Efcf86b6a7a33aE961A7Ec6C741F49bce11DA7'); 

        await web3MonitorProxy.methods.changeMonitor(subscriptionMigrations.address).send({from: account.address, gas: 250000});

        const newMonitor = await web3MonitorProxy.methods.newMonitor().call();

        await time.increase(60*60*24*15);
        await web3MonitorProxy.methods.confirmNewMonitor().send({from: account.address, gas: 250000});
        console.log('Monitor changed');

        const monitor = await web3MonitorProxy.methods.monitor().call();

        const subscriptionsContract = await OldSubscription.at('0x83152CAA0d344a2Fd428769529e2d490A88f4393');
        const web3SubscriptionsContract = new web3.eth.Contract(OldSubscription.abi, '0x83152CAA0d344a2Fd428769529e2d490A88f4393');

        const subscribersAll = await subscriptionsContract.getSubscribers();
        const subscribers = removeZeroElements(subscribersAll);

        console.log('Total subscribers:', subscribers.length);
        const cdpIds = subscribers.map(sub => sub.cdpId);
        const chunks = chunk(cdpIds, 15);

        console.log('Authorize bot');
        await web3SubscriptionMigraitons.methods.setAuthorized(account.address, true).send({from: accounts[0], gas: 250000});
        console.log('Bot authorized');

        for (var i = chunks.length - 1; i >= 0; i--) {
            console.log('migrating:', chunks[i]);
            await web3SubscriptionMigraitons.methods.migrate(chunks[i]).send({from: account.address, gas: 4000000});
            const newSubscribers = await subscriptionsContract.getSubscribers();
        }

        console.log("subscriptions migrated")

        console.log('Total subscribers:', subscribers.length);
        const owners = subscribers.map(sub => sub.owner);
        const chunks1 = chunk(owners, 15);

        for (var i = chunks1.length-1; i >= 0; i--) {
            console.log(chunks1[i])
            await web3SubscriptionMigraitons.methods.removeAuthority(chunks1[i]).send({from: account.address, gas: 4000000});
        }

        const leftSubscribers = await subscriptionsContract.getSubscribers();
        console.log('Left subscribers:', removeZeroElements(leftSubscribers.length));

        for (var i = leftSubscribers.length-1; i >= 0; i--) {
            await web3SubscriptionsContract.methods.unsubscribeIfMoved(leftSubscribers[i].cdpId).send({from: account.address, gas: 500000});
        }

        const finalSubscribers = await subscriptionsContract.getSubscribers();
        console.log('Final subscribers:', removeZeroElements(finalSubscribers.length));

        expect(finalSubscribers.length).to.be.equal(0);
    });
});