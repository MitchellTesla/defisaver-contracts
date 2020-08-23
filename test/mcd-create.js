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
const MCDCreateTaker = contract.fromArtifact('MCDCreateTaker');
const MCDSaverTaker = contract.fromArtifact('MCDSaverTaker');

const mcdCreateTakerAddr = '0x21a59654176f2689d12E828B77a783072CD26680';
const uniswapWrapperAddr = '0x880A845A85F843a5c67DB2061623c6Fc3bB4c511';
const oldUniswapWrapperAddr = '0x1e30124FDE14533231216D95F7798cD0061e5cf8';
const mcdSaverTakerAddr = '0xafaa78182ad0ba15e32f525e49d575b3716a1e57';

const makerVersion = "1.0.9";

describe("MCD-Create", accounts => {
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
        mcdCreateTaker = await MCDCreateTaker.at(mcdCreateTakerAddr);
        mcdSaverTaker = await MCDSaverTaker.at(mcdSaverTakerAddr);


    });

    it('... should buy a token', async () => {
        const ethAmount = web3.utils.toWei('5', 'ether');
        await web3Exchange.methods.swapEtherToToken(ethAmount, WBTC_ADDRESS, '0').send({from: accounts[0], value: ethAmount, gas: 800000});

        const tokenBalance = await getBalance(web3, accounts[0], WBTC_ADDRESS);
        console.log(tokenBalance/ 1e18);
        expect(tokenBalance).to.be.bignumber.is.above('0');
    });

    it('... should open up leveraged Eth vault', async () => {
        let ilk = 'ETH_A';
        let collToken = ETH_ADDRESS;
        let depositAmount = web3.utils.toWei('2', 'ether');
        let daiAmount = web3.utils.toWei('800', 'ether');

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(mcdCreateTaker, 'openWithLoan'),
        [[makerAddresses["MCD_DAI"], collToken, daiAmount, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
        [depositAmount, daiAmount, makerAddresses[`MCD_JOIN_${ilk}`]]]);

        await web3Proxy.methods['execute(address,bytes)']
            (mcdCreateTakerAddr, data).send({from: accounts[0], gas: 3500000, value: depositAmount});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        const vaultId = cdpsAfter.ids[cdpsAfter.ids.length - 1];

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);

        daiAmount = daiAmount / 1e18;
        let aaveFee = daiAmount * 0.0009;

        expect(vaultInfo.debt / 1e18).is.equal(daiAmount + aaveFee);
        expect(vaultInfo.collateral / 1e18).is.gt(depositAmount / 1e18);
    });

    it('... should open up leveraged Bat vault', async () => {
        let ilk = 'BAT_A';
        let collToken = BAT_ADDRESS;
        let depositAmount = web3.utils.toWei('2500', 'ether');
        let daiAmount = web3.utils.toWei('600', 'ether');

        await approve(web3, collToken, accounts[0], proxyAddr);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(mcdCreateTaker, 'openWithLoan'),
        [[makerAddresses["MCD_DAI"], collToken, daiAmount, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
        [depositAmount, daiAmount, makerAddresses[`MCD_JOIN_${ilk}`]]]);

        await web3Proxy.methods['execute(address,bytes)']
            (mcdCreateTakerAddr, data).send({from: accounts[0], gas: 4500000});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        const vaultId = cdpsAfter.ids[cdpsAfter.ids.length - 1];

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);

        daiAmount = daiAmount / 1e18;
        let aaveFee = daiAmount * 0.0009;

        const ratio = await getRatio(vaultId);
        console.log('ratio: ', ratio);

        expect(vaultInfo.debt / 1e18).is.equal(daiAmount + aaveFee);
        expect(vaultInfo.collateral / 1e18).is.gt(depositAmount / 1e18);
    });

    it('... should open up leveraged Wbtc vault', async () => {
        let ilk = 'WBTC_A';
        let collToken = WBTC_ADDRESS;
        let depositAmount = 0.1* 1e8;
        let daiAmount = web3.utils.toWei('800', 'ether');

        await approve(web3, collToken, accounts[0], proxyAddr);

        const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(mcdCreateTaker, 'openWithLoan'),
        [[makerAddresses["MCD_DAI"], collToken, daiAmount, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
        [depositAmount, daiAmount, makerAddresses[`MCD_JOIN_${ilk}`]]]);

        await web3Proxy.methods['execute(address,bytes)']
            (mcdCreateTakerAddr, data).send({from: accounts[0], gas: 4500000});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        const vaultId = cdpsAfter.ids[cdpsAfter.ids.length - 1];

        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);

        daiAmount = daiAmount / 1e18;
        let aaveFee = daiAmount * 0.0009;

        const ratio = await getRatio(vaultId);
        console.log('ratio: ', ratio);

        expect(vaultInfo.debt / 1e18).is.equal(daiAmount + aaveFee);
        expect(vaultInfo.collateral / 1e18).is.gt(depositAmount / 1e18);
    });


    const getRatio = async (vaultId) => {
        const vaultInfo = await mcdSaverTaker.getCdpDetailedInfo(vaultId);
        let ratio = ((vaultInfo.collateral / 1e18) * vaultInfo.price) / vaultInfo.debt;

        return ratio / 1e7;
    }

});
