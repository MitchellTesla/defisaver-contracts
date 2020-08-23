const Web3 = require('web3');

const { loadAccounts, getAccounts, fundIfNeeded } = require('../test/helper.js');


const fundAccounts = async (accs) => {
    let web3 = new Web3(new Web3.providers.HttpProvider(process.env.MOON_NET_NODE));
    web3 = loadAccounts(web3);
    const accounts = getAccounts(web3);


    for (var i = accs.length - 1; i >= 0; i--) {
        await fundIfNeeded(web3, accounts[0], accs[i]);
    }
}

(async () => {
    const accs = ['0x6c259ea1fCa0D1883e3FFFdDeb8a0719E1D7265f'];

    await fundAccounts(accs);
})();