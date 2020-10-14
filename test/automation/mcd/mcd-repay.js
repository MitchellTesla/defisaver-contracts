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

const encodeMcdSupplyAction = (vaultId, amount, joinAddr, from) => {

    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['bytes32', 'uint256','uint256', 'address', 'address', 'uint8[]'],
        [web3.utils.keccak256('McdSupply'), vaultId, amount, joinAddr, from, []]
    );

    return encodeActionParams;
};

const getRegistryAddr = async (web3, registry, name) => {
    console.log(web3.utils.keccak256(name));
    const addr = await registry.methods.getAddr(web3.utils.keccak256(name)).call();

    return addr;
}

const encodeMcdWithdrawAction = (vaultId, amount, joinAddr) => {
    const callDataParams = web3.eth.abi.encodeParameters(
        ['uint256','uint256', 'address', 'uint8[]'],
        [ vaultId, amount, joinAddr, []]
    );

    const encodeActionParams = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'],
        [web3.utils.keccak256('McdWithdraw'), callDataParams]
    );

    return encodeActionParams;
};

const encodeDfsSellAction = (fromToken, toToken, amount) => {
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
        [encodeExchangeParams, nullAddress, nullAddress, []]
    );

    const encodeCallData = web3.eth.abi.encodeParameters(
        ['bytes32', 'bytes'],
        [web3.utils.keccak256('DfsSell'), encodeActionParams]
    );

    return encodeCallData;
};

describe("MCD-Repay", () => {
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
        const ilk = 'ETH_A';
        const collAmount = web3.utils.toWei('2', 'ether');
        const debtAmount =  web3.utils.toWei('300', 'ether');

        vaultId = await createVault(ilk, collAmount, debtAmount);

        const ratio = await getRatio(vaultId);
        console.log('VaultId: ' + vaultId + ' Ratio: ', ratio);
    });

    it('... should execute a repay call', async () => {
        const repayAmount = web3.utils.toWei('0.1', 'ether');

        const actionManagerProxyAddr = await getRegistryAddr(web3, registry, 'ActionManagerProxy');

        const withdrawCall = encodeMcdWithdrawAction(vaultId, repayAmount, mcdEthJoin);
        const sellCall = encodeDfsSellAction(ETH_ADDRESS, makerAddresses["MCD_DAI"], repayAmount);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionManagerProxy, 'manageActions'),
        [[0, 0], [withdrawCall, sellCall]]);

        await web3Proxy.methods['execute(address,bytes)']
           (actionManagerProxyAddr, data).send({from: accounts[0], gas: 3000000});

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
