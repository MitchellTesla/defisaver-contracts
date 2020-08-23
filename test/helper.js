let { contract } = require('@openzeppelin/test-environment');
const DSProxy = contract.fromArtifact("DSProxy");
const DebugInfo = contract.fromArtifact("DebugInfo");
const axios = require('axios');
const Dec = require('decimal.js');

const nullAddress = "0x0000000000000000000000000000000000000000";
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const BAT_ADDRESS = '0x0d8775f648430679a709e98d2b0cb6250d2887ef';
const REP_ADDRESS = '0x1985365e9f78359a9b6ad760e32412f4a445e862';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const ZRX_ADDRESS = '0xe41d2489571d322189246dafa5ebde1f4699f498';
const C_ETH_ADDRESS = '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5';
const C_DAI_ADDRESS = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
const C_BAT_ADDRESS = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e';
const C_REP_ADDRESS = '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1';
const C_USDC_ADDRESS = '0x39aa39c021dfbae8fac545936693ac917d5e7563';
const C_USDT_ADDRESS = '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9';
const C_WBTC_ADDRESS = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4';
const C_ZRX_ADDRESS = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407';

const saverExchangeAddress = "0xb2287CA4A461A9bB73817Fdd38fD14b59b8Fb714";
const mcdSaverProxyAddress = "0xa292832ACF0b0226E378E216A982fA966eaA7EBc";

const debugContractAddr = '0xe982E462b094850F12AF94d21D470e21bE9D0E9C';

const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const ERC20 = contract.fromArtifact("ERC20");

const fetchMakerAddresses = async (version, params = {}) => {
    const url = `https://changelog.makerdao.com/releases/mainnet/${version}/contracts.json`;

    const res = await axios.get(url, params);

    // console.log(res.data);

    return res.data;
};

const wdiv = (a, b) => {
    const wad = Dec(1e18);

    return Dec(a).mul(wad).add(Dec(b).div('2')).div(b);
}

const wmul = (a, b) => {
    const wad = Dec(1e18);

    return Dec(a).mul(b).add(wad.div('2')).div(wad);
}

const loadAccounts = (web3) => {
    const account = web3.eth.accounts.privateKeyToAccount('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
    web3.eth.accounts.wallet.add(account);

    return web3;
};

const getAccounts = (web3) => {
    const walletes = Object.values(web3.eth.accounts.wallet);

    return walletes.map(w => w.address);
};


const getAbiFunction = (contract, functionName) => {
    const abi = contract.abi;

    return abi.find(abi => abi.name === functionName);
};

const fundIfNeeded = async (web3, fundAccAddress, accAddress, minBal=5, addBal=10) => {
    const weiBal = await web3.eth.getBalance(accAddress);
    const bal = web3.utils.fromWei(weiBal.toString(), 'ether')

    console.log(`Funding ${accAddress}, current balance: ${bal.toString()} from: ${fundAccAddress}`);
    if (parseFloat(bal) < minBal) {
        await web3.eth.sendTransaction({gas: 200000, from: fundAccAddress, to: accAddress, value: web3.utils.toWei(addBal.toString(), "ether")});
    }
};

const getProxy = async (registry, acc, web3) => {
    let proxyAddr = await registry.proxies(acc);

    if (proxyAddr === nullAddress) {
        await registry.build(acc, {from: acc});
        proxyAddr = await registry.proxies(acc);
    }

    proxy = await DSProxy.at(proxyAddr);
    let web3proxy = null;

    if (web3 != null) {
        web3proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
    }

    return { proxy, proxyAddr, web3proxy };
};

const getBalance = async (web3, account, tokenAddress) => {
    if (tokenAddress === ETH_ADDRESS) {
        const ethBalance = await web3.eth.getBalance(account);
        return ethBalance.toString();
    }

    const erc20 = await ERC20.at(tokenAddress);

    const tokenBalance = await erc20.balanceOf(account);
    return tokenBalance.toString();
};

const approve = async (web3, tokenAddress, from, to, amount) => {
    if (tokenAddress === ETH_ADDRESS) {
        console.log('eth address - not approving');
        return;
    }

    if (!amount) {
        amount = MAX_UINT;
    }

    const erc20 = new web3.eth.Contract(ERC20.abi, tokenAddress);
    await erc20.methods.approve(to, amount).send({from, gas: 100000});
};

const transferToken = async (web3, tokenAddress, from, to, amount) => {
    if (tokenAddress === ETH_ADDRESS) {
        return;
    }

    console.log('Transfer tokens');
    const erc20 = new web3.eth.Contract(ERC20.abi, tokenAddress);
    await erc20.methods.transfer(to, amount).send({from, gas: 250000});
    console.log('Tokens transfered');
};

const getDebugInfo = async (id, type) => {
    const debugContract = await DebugInfo.at(debugContractAddr);

    if (type === 'uint') {
        return (await debugContract.uintValues(id));
    } else if (type === 'addr') {
        return (await debugContract.addrValues(id));
    } else if (type === 'string') {
        return (await debugContract.stringValues(id));
    } else if (type === 'bytes32') {
        return (await debugContract.bytes32Values(id));
    }



}

module.exports = {
    getAbiFunction,
    loadAccounts,
    getAccounts,
    getBalance,
    approve,
    getProxy,
    fetchMakerAddresses,
    fundIfNeeded,
    getDebugInfo,
    nullAddress,
    saverExchangeAddress,
    mcdSaverProxyAddress,
    ETH_ADDRESS,
    BAT_ADDRESS,
    REP_ADDRESS,
    ZRX_ADDRESS,
    WBTC_ADDRESS,
    USDC_ADDRESS,
    USDT_ADDRESS,
    C_ETH_ADDRESS,
    C_DAI_ADDRESS,
    C_REP_ADDRESS,
    C_BAT_ADDRESS,
    C_USDC_ADDRESS,
    C_USDT_ADDRESS,
    C_WBTC_ADDRESS,
    C_ZRX_ADDRESS,
    WETH_ADDRESS,
    transferToken,
    MAX_UINT,
    wmul,
    wdiv
};
