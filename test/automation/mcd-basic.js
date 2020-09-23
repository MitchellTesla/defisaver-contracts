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
    BAT_ADDRESS,
    WBTC_ADDRESS,
    WETH_ADDRESS,
    nullAddress,
    getDebugInfo,
} = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");

const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const MCDCloseTaker = contract.fromArtifact('MCDCloseTaker');
const MCDSaverTaker = contract.fromArtifact('MCDSaverTaker');

const mcdCloseTakerAddr = '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B';
const mcdCloseFlashLoanAddr = '0xdAA71FBBA28C946258DD3d5FcC9001401f72270F';

const uniswapWrapperAddr = '0x0d3C71782055bD88A71b611972152d6e984EDF79';
const oldUniswapWrapperAddr = '0x1e30124FDE14533231216D95F7798cD0061e5cf8';
const mcdSaverTakerAddr = '0xafaa78182ad0ba15e32f525e49d575b3716a1e57';

const makerVersion = "1.0.6";

describe("MCD-Close", accounts => {
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
        web3Exchange = new web3.eth.Contract(ExchangeInterface.abi, oldUniswapWrapperAddr);
        mcdCloseTaker = await MCDCloseTaker.at(mcdCloseTakerAddr);
        mcdSaverTaker = await MCDSaverTaker.at(mcdSaverTakerAddr);


    });

    it('... should create and subscribe ETH vault', async () => {
        let ilk = 'ETH_A';
        let collToken = ETH_ADDRESS;

        const vaultId = await createVault(ilk, web3.utils.toWei('4', 'ether'), web3.utils.toWei('500', 'ether'));

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);


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
