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
    ETH_ADDRESS,
    ETH_JOIN_ADDRESS,
    DAI_JOIN_ADDRESS,
    BAT_ADDRESS,
    WBTC_ADDRESS,
    WETH_ADDRESS,
    nullAddress,
    getDebugInfo,
} = require('../helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");

const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const Executor = contract.fromArtifact('Executor');
const SubscriptionProxy = contract.fromArtifact('SubscriptionProxy');

const executorAddr = '0x1fe73e3525E709D0FBfcd089e0158c5248d0328e';
const subscriptionProxyAddr = '0xd69e0a5d8F37B5849045805149e2d6C51e0279E2';

const makerVersion = "1.0.6";

const OVER = 0;
const UNDER = 1;

const encodeMcdRatioTriggerData = (vaultId, ratio, type) => {
    const encodeTriggerParams = web3.eth.abi.encodeParameters(
        ['uint256','uint256', 'uint8'],
        [vaultId, ratio, type]
    );

    return encodeTriggerParams;
};

const encodeMcdGenerateAction = (vaultId, amount, joinAddr) => {
    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['uint256','uint256', 'address'],
        [vaultId, amount, joinAddr]
    );

    const encodedAction = web3.eth.abi.encodeParameters(
        ['bytes32','bytes'],
        [web3.utils.keccak256('McdGenerate'), encodeTriggerParams]
    );

    return encodedAction;
};

describe("Automation-MCD-Basic", () => {
    let registry, proxy, proxyAddr, makerAddresses,
        web3LoanInfo, web3Exchange, collToken, boostAmount, borrowToken, repayAmount,
        collAmount, borrowAmount, getCdps, mcdSaverTaker, tokenId;

    before(async () => {
    	makerAddresses = await fetchMakerAddresses(makerVersion);

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        registry = await ProxyRegistryInterface.at(makerAddresses["PROXY_REGISTRY"]);

        const proxyInfo = await getProxy(registry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
        getCdps = await GetCdps.at(makerAddresses["GET_CDPS"]);

    });

    it('... should create and subscribe ETH vault', async () => {
        let ilk = 'ETH_A';
        let collToken = ETH_ADDRESS;
        const vaultId = await createVault(ilk, web3.utils.toWei('2', 'ether'), web3.utils.toWei('300', 'ether'));

        const generateAmount = web3.utils.toWei('20', 'ether'); // 20 Dai
        const minRatio = '';

        const mcdRatioTriggerData = encodeMcdRatioTriggerData(vaultId, minRatio, UNDER);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(SubscriptionProxy, 'subscribe'),
        [[{id: web3.utils.keccak256('McdRatioTrigger'), data: mcdRatioTriggerData}],
        [{id: web3.utils.keccak256('McdGenerate'), data: '0x0'}]]);

        await web3Proxy.methods['execute(address,bytes)']
           (subscriptionProxyAddr, data).send({from: accounts[0], gas: 1000000});

    });


    const createVault = async (type, _collAmount, _daiAmount) => {

        let ilk = '0x4554482d41000000000000000000000000000000000000000000000000000000';
        let value = _collAmount;
        let daiAmount = _daiAmount;

        if (type === 'BAT_A') {
            ilk = '0x4241542d41000000000000000000000000000000000000000000000000000000';
            value = '0';
        }

        let data = '';

        if (type === 'ETH_A') {
            data = web3.eth.abi.encodeFunctionCall(getAbiFunction(DSSProxyActions, 'openLockETHAndDraw'),
            [makerAddresses['CDP_MANAGER'], makerAddresses['MCD_JUG'], makerAddresses[`MCD_JOIN_${type}`], makerAddresses["MCD_JOIN_DAI"], ilk, daiAmount]);
        } else {
            await approve(web3, collToken, accounts[0], proxyAddr);

            data = web3.eth.abi.encodeFunctionCall(getAbiFunction(DSSProxyActions, 'openLockGemAndDraw'),
            [makerAddresses['CDP_MANAGER'], makerAddresses['MCD_JUG'], makerAddresses[`MCD_JOIN_${type}`], makerAddresses["MCD_JOIN_DAI"], ilk, _collAmount, daiAmount, true]);
        }

    	await proxy.methods['execute(address,bytes)'](makerAddresses['PROXY_ACTIONS'], data, {
            from: accounts[0], value});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        return cdpsAfter.ids[cdpsAfter.ids.length - 1].toString()
    }

});
