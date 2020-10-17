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

const registryAddr = '0x2f111D6611D3a3d559992f39e3F05aC0385dCd5D';


const makerVersion = "1.0.6";

const encodeMcdWithdrawAction = (vaultId, amount, joinAddr) => {
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

describe("MCD-Withdraw", () => {
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

    it('... should execute a direct withdraw call', async () => {
        const amount = web3.utils.toWei('0.1', 'ether');
        const generateAddr = await getRegistryAddr(web3, registry, 'McdWithdraw');

        const callData = encodeMcdWithdrawAction(vaultId, amount, mcdEthJoin);

        const vaultInfo = await mcdSaverProxy.getCdpDetailedInfo(vaultId.toString());
        const collBefore = vaultInfo.collateral / 1e18;

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(ActionInterface, 'executeAction'),
        [0, callData, []]);

        await web3Proxy.methods['execute(address,bytes)']
           (generateAddr, data).send({from: accounts[0], gas: 2000000});

        const vaultInfoAfter = await mcdSaverProxy.getCdpDetailedInfo(vaultId.toString());
        const collAfter = vaultInfoAfter.collateral / 1e18;

        console.log(`Eth before ${collBefore}, Eth after ${collAfter}`);

        expect(collBefore).to.be.gt(collAfter);
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
            from: accounts[0], value, gas: 3000000});

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
