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
    getRegistryAddr,
    createVault,
    getRatio,
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


const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const Executor = contract.fromArtifact('Executor');
const SubscriptionProxy = contract.fromArtifact('SubscriptionProxy');
const Subscriptions = contract.fromArtifact('Subscriptions');
const ActionManagerProxy = contract.fromArtifact('ActionManagerProxy');

const mcdGenerateAddress = '0x7EA4ED6aE31213EB2C4b3FBEC85b09082Ddfa6D5';
const registryAddr = '0x2b9FfFb8C8606A4a417a97Bc2977167131c74fe6';


const makerVersion = "1.0.6";

const encodeMcdGenerateAction = (vaultId, amount) => {
    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['uint256','uint256', 'uint8[]'],
        [vaultId, amount, []]
    );

    return encodeActionParams;
};

describe("MCD-Generate", () => {
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

    it('... should create and subscribe ETH vault', async () => {

        const generateAddr = await getRegistryAddr(web3, registry, 'McdGenerate');

        const ilk = 'ETH_A';
        const collAmount = web3.utils.toWei('2', 'ether');
        const debtAmount =  web3.utils.toWei('300', 'ether');

        vaultId = await createVault(web3, makerAddresses, accounts[0], ilk, collAmount, debtAmount);

        const ratio = await getRatio(vaultId);
        console.log('VaultId: ' + vaultId + ' Ratio: ', ratio);
    });

    // in order to save gas single actions are called directly through dsproxy
    // it('... should execute a direct generate call', async () => {
    //     const amount = web3.utils.toWei('20', 'ether');

    //     const triggerCallData = web3.eth.abi.encodeParameters(['uint256'], [0]);
    //     console.log(vaultId, amount);
    //     const actionCallData = encodeMcdGenerateAction(vaultId, amount);
    //     await executor.methods.executeStrategy(subId - 1, [triggerCallData], [actionCallData]).send({
    //         from: accounts[0], gas: 3000000
    //     });

    //     const afterRatio = await getRatio(vaultId);
    //     console.log(afterRatio);

    //     const t = await getDebugInfo("amount", "uint");
    //     console.log(t.toString());
    // });

});
