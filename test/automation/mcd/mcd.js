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


const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const Executor = contract.fromArtifact('Executor');
const SubscriptionProxy = contract.fromArtifact('SubscriptionProxy');
const Subscriptions = contract.fromArtifact('Subscriptions');
const ActionsManagerProxy = contract.fromArtifact('ActionsManagerProxy');

const executorAddr = '0x7EA4ED6aE31213EB2C4b3FBEC85b09082Ddfa6D5';
const subscriptionProxyAddr = '0x808554B05F7FB25E78c4e19672edBDb8f635EF70';
const subscriptionAddr = '0xA740851b4f6595f51E4E188535c80175b78C9f2d';
const registryAddr = '0x01c4038Ec528F6d7e5f8988863951Fb091eC4Ab2';

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
        ['uint256','uint256', 'address', 'uint8[]'],
        [vaultId, amount, joinAddr, []]
    );

    return encodeActionParams;
};

const getRegistryAddr = async (web3, registry, name) => {
    console.log(web3.utils.keccak256(name));
    const addr = await registry.methods.getAddr(web3.utils.keccak256(name)).call();

    return addr;
}

describe("Automation-MCD", () => {
    let registry, proxy, proxyAddr, makerAddresses,
        web3LoanInfo, web3Exchange, collToken, boostAmount, borrowToken,
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
        registry = new web3.eth.Contract(Registry.abi, registryAddr);
    });

    it('... should create and subscribe ETH vault', async () => {

        // const addr = await getRegistryAddr(web3, registry,  'Subscriptions');

        // console.log(addr);

        const ethBalance = await getBalance(web3, accounts[0], ETH_ADDRESS);
        console.log(ethBalance.toString() / 1e18);

        let ilk = 'ETH_A';
        vaultId = await createVault(ilk, web3.utils.toWei('2', 'ether'), web3.utils.toWei('300', 'ether'));

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

        const triggerCallData = web3.eth.abi.encodeParameters(['uint256'], [0]);
        console.log(vaultId, amount, mcdEthJoin);
        const actionCallData = encodeMcdGenerateAction(vaultId, amount, mcdEthJoin);
        await executor.methods.executeStrategy(subId - 1, [triggerCallData], [actionCallData]).send({
            from: accounts[0], gas: 3000000
        });

        const afterRatio = await getRatio(vaultId);
        console.log(afterRatio);

        const t = await getDebugInfo("amount", "uint");
        console.log(t.toString());
    });

    // in order to save gas single actions are called directly through dsproxy
    it('... should execute a direct generate call', async () => {
        const amount = web3.utils.toWei('20', 'ether');

        const triggerCallData = web3.eth.abi.encodeParameters(['uint256'], [0]);
        console.log(vaultId, amount, mcdEthJoin);
        const actionCallData = encodeMcdGenerateAction(vaultId, amount, mcdEthJoin);
        await executor.methods.executeStrategy(subId - 1, [triggerCallData], [actionCallData]).send({
            from: accounts[0], gas: 3000000
        });

        const afterRatio = await getRatio(vaultId);
        console.log(afterRatio);

        const t = await getDebugInfo("amount", "uint");
        console.log(t.toString());
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

    	// await proxy.methods['execute(address,bytes)'](makerAddresses['PROXY_ACTIONS'], data, {
        //     from: accounts[0], value, gas: 3000000});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        return cdpsAfter.ids[cdpsAfter.ids.length - 1].toString()
    };


    const getRatio = async (vaultId) => {
        const vaultInfo = await mcdSaverProxy.getCdpDetailedInfo(vaultId.toString());

        console.log(vaultInfo.debt.toString() / 1e18);

        const ratio = vaultInfo.collateral.mul(vaultInfo.price).div(vaultInfo.debt);

        return ratio.toString() / 1e25;

    }

});
