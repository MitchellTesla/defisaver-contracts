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
    nullAddress,
} = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");

const GetCdps = contract.fromArtifact('GetCdps');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const MCDCloseTaker = contract.fromArtifact('MCDCloseTaker');
const MCDSaverTaker = contract.fromArtifact('MCDSaverTaker');

const mcdCloseTakerAddr = '0xb4fFe5983B0B748124577Af4d16953bd096b6897';
const uniswapWrapperAddr = '0x880A845A85F843a5c67DB2061623c6Fc3bB4c511';
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

    it('... should buy a token', async () => {
        const ethAmount = web3.utils.toWei('5', 'ether');
        await web3Exchange.methods.swapEtherToToken(ethAmount, WBTC_ADDRESS, '0').send({from: accounts[0], value: ethAmount, gas: 800000});

        const tokenBalance = await getBalance(web3, accounts[0], WBTC_ADDRESS);
        console.log(tokenBalance/ 1e18);
        expect(tokenBalance).to.be.bignumber.is.above('0');
    });

    it('... should close Eth vault, exiting in Eth', async () => {
        let ilk = 'ETH_A';
        let collToken = ETH_ADDRESS;

        const balanceBefore = await getBalance(web3, accounts[0], collToken);

        const vaultId = await createVault(ilk, web3.utils.toWei('2', 'ether'), web3.utils.toWei('500', 'ether'));

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);

        let destAmount = Dec(vaultInfo.debt.toString()).times(1.05).toString(); // vault debt + 0.5%
        let srcAmount = vaultInfo.collateral.toString(); // vault coll

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(mcdCloseTaker, 'closeWithLoan'),
        [[collToken, makerAddresses["MCD_DAI"], srcAmount, destAmount, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
        [vaultId, makerAddresses[`MCD_JOIN_${ilk}`], 0, 0, 0, true, false]]);

        await web3Proxy.methods['execute(address,bytes)']
            (mcdCloseTakerAddr, data).send({from: accounts[0], gas: 3500000 });

        const balanceAfter = await getBalance(web3, accounts[0], collToken);

        console.log(balanceBefore / 1e18, balanceAfter / 1e18);
    });

    it('... should close Eth vault, exiting in Dai', async () => {
        let ilk = 'ETH_A';
        let collToken = ETH_ADDRESS;

        const vaultId = await createVault(ilk, web3.utils.toWei('2', 'ether'), web3.utils.toWei('500', 'ether'));

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);

        let destAmount = Dec(vaultInfo.debt.toString()).times(1.05).toString(); // vault debt + 0.5%
        let srcAmount = vaultInfo.collateral.toString(); // vault coll

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(mcdCloseTaker, 'closeWithLoan'),
        [[collToken, makerAddresses["MCD_DAI"], srcAmount, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
        [vaultId, makerAddresses[`MCD_JOIN_${ilk}`], 0, 0, 0, true, true]]);

        await web3Proxy.methods['execute(address,bytes)']
            (mcdCloseTakerAddr, data).send({from: accounts[0], gas: 3500000 });
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
