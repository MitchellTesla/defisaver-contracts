let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert, send } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Dec = require('decimal.js');

const {
    getAbiFunction,
    getBalance,
    approve,
    loadAccounts,
    getAccounts,
    getProxy,
    fetchMakerAddresses,
    mcdSaverProxyAddress,
    ETH_ADDRESS,
    DAI_JOIN_ADDRESS,
    BAT_ADDRESS,
    WBTC_ADDRESS,
    WETH_ADDRESS,
    nullAddress,
    getDebugInfo,
} = require('../../helper.js');

const mcdEthJoin = '0x2F0b23f53734252Bda2277357e97e1517d6B042A';

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const MCDSaverProxy = contract.fromArtifact('MCDSaverProxy');
const Registry = contract.fromArtifact('Registry');
const ActionInterface = contract.fromArtifact('ActionInterface');


const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const Executor = contract.fromArtifact('Executor');
const SubscriptionProxy = contract.fromArtifact('SubscriptionProxy');
const Subscriptions = contract.fromArtifact('Subscriptions');
const ActionManagerProxy = contract.fromArtifact('ActionManagerProxy');

const registryAddr = '0xf20Fa06314385df317D1eF374a944A7e29CCfd89';
const wrapperAddress = '0x3Ba0319533C578527aE69BF7fA2D289F20B9B55c';

const makerVersion = "1.0.6";

const encodeDfsSellAction = (fromToken, toToken, amount, from, to) => {
    const encodeExchangeParams1 = web3.eth.abi.encodeParameters(
        ['address', 'address', 'uint256', 'uint256'],
        [fromToken, toToken, amount, 0]
    );

    const encodeExchangeParams2 = web3.eth.abi.encodeParameters(
        ['uint256', 'address', 'address', 'bytes', 'uint256'],
        [0, wrapperAddress, nullAddress, "0x0", 0]
    );

    const encodeExchangeParams = web3.eth.abi.encodeParameters(
        ['bytes', 'bytes'],
        [encodeExchangeParams1, encodeExchangeParams2]
    );

    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['bytes', 'address', 'address', 'uint8[]'],
        [encodeExchangeParams, from, to, []]
    );

    return encodeActionParams;
};

describe("DFS-Sell", () => {
    let registry, proxy, proxyAddr, makerAddresses, proxyRegistry,
        web3LoanInfo, web3Exchange, collToken, boostAmount, borrowToken,
        collAmount, borrowAmount, getCdps, subscriptions, executor, subId, vaultId;

    before(async () => {
    	makerAddresses = await fetchMakerAddresses(makerVersion);

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        proxyRegistry = await ProxyRegistryInterface.at(makerAddresses["PROXY_REGISTRY"]);
        registry = new web3.eth.Contract(Registry.abi, registryAddr);

        const proxyInfo = await getProxy(proxyRegistry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
        getCdps = await GetCdps.at(makerAddresses["GET_CDPS"]);
        mcdSaverProxy = await MCDSaverProxy.at(mcdSaverProxyAddress);
    });

    const getRegistryAddr = async (web3, registry, name) => {
        const addr = await registry.methods.getAddr(web3.utils.keccak256(name)).call();

        return addr;
    };


    it('... should execute a sell ETH -> Dai', async () => {
        const amount = web3.utils.toWei('0.1', 'ether');
        const dfsSellAddr = await getRegistryAddr(web3, registry, 'DfsSell');

        const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log(daiBalanceBefore.toString() / 1e18);

        const callData = encodeDfsSellAction(ETH_ADDRESS, makerAddresses["MCD_DAI"], amount, accounts[0], accounts[0]);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionInterface, 'executeAction'),
        [0, callData, []]);

        await web3Proxy.methods['execute(address,bytes)']
           (dfsSellAddr, data).send({from: accounts[0], gas: 3000000, value: amount});

        const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);
        console.log(daiBalanceAfter.toString() / 1e18);

        console.log(`Dai before ${daiBalanceBefore}, Dai after ${daiBalanceAfter}`);

        expect(daiBalanceAfter / 1e18).to.be.gt(daiBalanceBefore / 1e18);
    });

});
