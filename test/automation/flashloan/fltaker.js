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
const ERC20 = contract.fromArtifact("ERC20");
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

const registryAddr = '0x2f111D6611D3a3d559992f39e3F05aC0385dCd5D';

const AAVE_FL = 1;
const DYDX_FL = 2;

const makerVersion = "1.0.6";

const encodeFLAction = (amount, tokenAddr, flType) => {
    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['uint256','address', 'uint8'],
        [amount, tokenAddr, flType]
    );

    const encodeCallData = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'],
        [web3.utils.keccak256('FLTaker'), encodeActionParams]
    );

    return encodeCallData;
};

const getRegistryAddr = async (web3, registry, name) => {
    const addr = await registry.methods.getAddr(web3.utils.keccak256(name)).call();

    return addr;
}

describe("FL-Taker", () => {
    let registry, proxy, proxyAddr, makerAddresses, proxyRegistry, daiToken,
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
        daiToken = new web3.eth.Contract(ERC20.abi, makerAddresses["MCD_DAI"]);
    });

    // it('... should get an ETH Aave flash loan', async () => {
    //     const actionManagerProxyAddr = await getRegistryAddr(web3, registry, 'ActionManagerProxy');
    //     const actionExecutorAddr = await getRegistryAddr(web3, registry, 'ActionExecutor');
    //     const loanAmount = web3.utils.toWei('1', 'ether');

    //     const flCall = encodeFLAction(loanAmount, ETH_ADDRESS, AAVE_FL);

    //     console.log('Sending 0.01 for fee eth to: ', actionExecutorAddr);
    //     await send.ether(accounts[0], actionExecutorAddr, web3.utils.toWei('0.01', 'ether'));

    //     const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionManagerProxy, 'manageActions'),
    //     [[0], [flCall]]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //        (actionManagerProxyAddr, data).send({from: accounts[0], gas: 3000000});
    // });

    // it('... should get an Dai Aave flash loan', async () => {
    //     const actionManagerProxyAddr = await getRegistryAddr(web3, registry, 'ActionManagerProxy');
    //     const actionExecutorAddr = await getRegistryAddr(web3, registry, 'ActionExecutor');
    //     const loanAmount = web3.utils.toWei('100', 'ether');

    //     const flCall = encodeFLAction(loanAmount, makerAddresses["MCD_DAI"], AAVE_FL);

    //     console.log('Sending 1 for fee dai to: ', actionExecutorAddr);
    //     await daiToken.methods.transfer(actionExecutorAddr, web3.utils.toWei('1', 'ether')).send({from: accounts[0], gas: 300000});

    //     const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionManagerProxy, 'manageActions'),
    //     [[0], [flCall]]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //        (actionManagerProxyAddr, data).send({from: accounts[0], gas: 3000000});
    // });

    it('... should get an Eth DyDx flash loan', async () => {
        const actionManagerProxyAddr = await getRegistryAddr(web3, registry, 'ActionManagerProxy');
        const actionExecutorAddr = await getRegistryAddr(web3, registry, 'ActionExecutor');
        const loanAmount = web3.utils.toWei('1', 'ether');

        const flCall = encodeFLAction(loanAmount, ETH_ADDRESS, DYDX_FL);

        console.log('Sending 0.01 for fee eth to: ', actionExecutorAddr);
        await send.ether(accounts[0], actionExecutorAddr, web3.utils.toWei('0.01', 'ether'));

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionManagerProxy, 'manageActions'),
        [[0], [flCall]]);

        await web3Proxy.methods['execute(address,bytes)']
           (actionManagerProxyAddr, data).send({from: accounts[0], gas: 3000000});
    });
});
