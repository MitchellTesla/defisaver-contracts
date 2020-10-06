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
} = require('../helper.js');

const mcdEthJoin = '0x2F0b23f53734252Bda2277357e97e1517d6B042A';

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const MCDSaverProxy = contract.fromArtifact('MCDSaverProxy');


const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const Executor = contract.fromArtifact('Executor');
const SubscriptionProxy = contract.fromArtifact('SubscriptionProxy');
const Subscriptions = contract.fromArtifact('Subscriptions');

const executorAddr = '0x4dbeC827905A64c15Abe3dDDfAf5A095F816b5eb';
const subscriptionProxyAddr = '0xa5bc87AA4647B27E6695f78a5164bf65EcA87E77';
const subscriptionAddr = '0x9eFe9d52e8Eb71C7FE14853b7bfD97eCEa0b2e40';

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

    return encodeActionParams;
};

describe("Automation-MCD", () => {
    let registry, proxy, proxyAddr, makerAddresses,
        web3LoanInfo, web3Exchange, collToken, boostAmount, borrowToken, repayAmount,
        collAmount, borrowAmount, getCdps, subscriptions, executor, subId, vaultId;

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
        subscriptions = await Subscriptions.at(subscriptionAddr);
        mcdSaverProxy = await MCDSaverProxy.at(mcdSaverProxyAddress);
        executor = new web3.eth.Contract(Executor.abi, executorAddr);
    });

    it('... should create and subscribe ETH vault', async () => {
        let ilk = 'ETH_A';
        vaultId = await createVault(ilk, web3.utils.toWei('2', 'ether'), web3.utils.toWei('350', 'ether'));

        const ratio = await getRatio(vaultId);
        console.log('VaultId: ' + vaultId + ' Ratio: ', ratio);

        const minRatio = '2500000000000000000';

        const mcdRatioTriggerData = encodeMcdRatioTriggerData(vaultId, minRatio, UNDER);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(SubscriptionProxy, 'subscribe'),
        [
            executorAddr,
            subscriptionAddr,
            [{id: web3.utils.keccak256('McdRatioTrigger'), data: mcdRatioTriggerData}],
            [{id: web3.utils.keccak256('McdGenerate'), data: '0x0'}]
        ]);

        await web3Proxy.methods['execute(address,bytes)']
           (subscriptionProxyAddr, data).send({from: accounts[0], gas: 2000000});

        subId = (await subscriptions.getStreategyCount()).toString();
        console.log('Sub: ', subId);

    });

    it('... should execute a strategy', async () => {

        const amount = web3.utils.toWei('20', 'ether');

        const triggerCallData = '0x0';
        const actionCallData = encodeMcdGenerateAction(vaultId, amount, mcdEthJoin);
        await executor.methods.executeStrategy(subId, [triggerCallData], [actionCallData]).send({
            from: accounts[0], gas: 3000000
        });
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
    };


    const getRatio = async (vaultId) => {
        const vaultInfo = await mcdSaverProxy.getCdpDetailedInfo(vaultId.toString());

        const ratio = vaultInfo.collateral.mul(vaultInfo.price).div(vaultInfo.debt);

        return ratio.toString() / 1e25;

    }

});