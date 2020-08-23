

const Web3 = require('web3');

require('dotenv').config();

const DSProxy = require('../build/contracts/DSProxy.json');
const ProxyRegistryInterface = require('../build/contracts/ProxyRegistryInterface.json');

const LoanShifterTaker = require('../build/contracts/LoanShifterTaker.json');

const ETH_ILK = '0x4554482d41000000000000000000000000000000000000000000000000000000';
const BAT_ILK = '0x4241542d41000000000000000000000000000000000000000000000000000000';

const nullAddress = '0x0000000000000000000000000000000000000000';

const loanShifterTakerAddr = '0x7a941556F91FD54a224b36376C512A9883eDD859';
const mcdEthJoin = '0x2F0b23f53734252Bda2277357e97e1517d6B042A';
const mcdBatJoin = '0x3D0B1912B66114d4096F48A8CEe3A56C231772cA';

const {
    fetchMakerAddresses,
    ETH_ADDRESS,
    BAT_ADDRESS,
} = require('../test/helper.js');

const getTokenJoinAddr = (type) => {
    return tokenJoinAddrData['42'][type];
};

const makerVersion = "1.0.6";


const initContracts = async () => {

    makerAddresses = await fetchMakerAddresses(makerVersion);

    web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_ENDPOINT));

    account = web3.eth.accounts.privateKeyToAccount('0x'+process.env.PRIV_KEY)
    web3.eth.accounts.wallet.add(account)

    registry = new web3.eth.Contract(ProxyRegistryInterface.abi, makerAddresses["PROXY_REGISTRY"]);

    proxyAddr = await registry.methods.proxies(account.address).call();
    proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);


};

function getAbiFunction(contract, functionName) {
    const abi = contract.abi;

    return abi.find(abi => abi.name === functionName);
}

(async () => {
    await initContracts();

    // await mergeVaults();
    await changeMcdColl();
})();

const mergeVaults = async () => {

    const cdp1 = '6770';
    const cdp2 = '6629';

    const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    [
     [0, 0, false, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('10', 'ether'), makerAddresses["MCD_DAI"], mcdEthJoin, mcdEthJoin, cdp1, cdp2],
    // [nullAddress, nullAddress, 0, 0, 0, 0, nullAddress, "0x0", 0]
    ]);

    await proxy.methods['execute(address,bytes)']
     (loanShifterTakerAddr, moveData).send({from: account.address, gas: 500000, gasPrice: 46100000000});
};

const changeMcdColl = async () => {

    const vaultId = '6629';

    const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    [
     [0, 0, 1, true, web3.utils.toWei('0.18', 'ether'), web3.utils.toWei('23.31', 'ether'), makerAddresses["MCD_DAI"], mcdEthJoin, mcdBatJoin, vaultId, '0'],
     [ETH_ADDRESS, BAT_ADDRESS, web3.utils.toWei('0.1', 'ether'), 0, 0, 3, nullAddress, "0x0", 0]
    ]);

    const tx = await proxy.methods['execute(address,bytes)']
    (loanShifterTakerAddr, moveData).send({from: account.address, gas: 2200000, gasPrice: 17100000000});

};

