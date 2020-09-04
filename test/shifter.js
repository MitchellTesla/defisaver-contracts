let { accounts, contract, web3, provider } = require('@openzeppelin/test-environment');
const { expectEvent, balance, expectRevert } = require('@openzeppelin/test-helpers');
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
    C_ETH_ADDRESS,
    BAT_ADDRESS,
    C_BAT_ADDRESS,
    C_DAI_ADDRESS,
    nullAddress,
    USDC_ADDRESS,
    C_USDC_ADDRESS
} = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const GetCdps = contract.fromArtifact('GetCdps');
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const CompoundLoanInfo = contract.fromArtifact('CompoundLoanInfo');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const CTokenInterface = contract.fromArtifact('CTokenInterface');
const ComptrollerInterface = contract.fromArtifact('ComptrollerInterface');
const DSSProxyActions = contract.fromArtifact('DssProxyActions');
const LoanShifterTaker = contract.fromArtifact('LoanShifterTaker');
const MCDSaverProxy = contract.fromArtifact('MCDSaverProxy');
const ShifterRegistry = contract.fromArtifact('ShifterRegistry');
const ERC20 = contract.fromArtifact('ERC20');

const shifterRegistryAddr = '0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66';
const loanShifterTakerAddr = '0x180D179Bbf473A30183Fe858E8416351D2170Fd2';

// loanShifterReceiverAddress 0x770191B327a9f6cd83B997F68c1ce3c8e6a018dc
// compShifterAddress 0x84b085c0d4B4D6fbf6490f8246Bc5cD317d2d4cD
// mcdShifterAddress 0xDf3Cf8b9978c9c5639E06da3bfF5014ab5c055d1
// loanShifterTakerAddr:  0x180D179Bbf473A30183Fe858E8416351D2170Fd2

const compoundLoanInfoAddr = '0xb1f40b5109bba75c27a302c4e5d2afc30d5d1f30';
const comptrollerAddr = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const uniswapWrapperAddr = '0xe982E462b094850F12AF94d21D470e21bE9D0E9C';
const oldUniswapWrapperAddr = '0x1e30124FDE14533231216D95F7798cD0061e5cf8';


const mcdDaiJoin = '0x9759A6Ac90977b93B58547b4A71c78317f391A28';
const mcdEthJoin = '0x2F0b23f53734252Bda2277357e97e1517d6B042A';
const mcdBatJoin = '0x3D0B1912B66114d4096F48A8CEe3A56C231772cA';

const makerVersion = "1.0.6";

const MCD_PROTOCOL = 0;
const COMP_PROTOCOL = 1;

const NO_SWAP = 0;
const COLL_SWAP = 1;
const DEBT_SWAP = 2;

describe("Shifter", accounts => {
    let registry, proxy, proxyAddr, makerAddresses,
        web3LoanInfo, web3Exchange, collToken, cCollAddr, cCollToken, borrowToken, cBorrowAddr, cBorrowToken,
        collAmount, borrowAmount, comptroller;

    before(async () => {
    	makerAddresses = await fetchMakerAddresses(makerVersion);

        web3 = loadAccounts(web3);
        accounts = getAccounts(web3);

        registry = await ProxyRegistryInterface.at(makerAddresses["PROXY_REGISTRY"]);

        const proxyInfo = await getProxy(registry, accounts[0]);
        proxy = proxyInfo.proxy;
        proxyAddr = proxyInfo.proxyAddr;
        getCdps = await GetCdps.at(makerAddresses["GET_CDPS"]);
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
        comptroller = new web3.eth.Contract(ComptrollerInterface.abi, comptrollerAddr);
        web3LoanInfo = new web3.eth.Contract(CompoundLoanInfo.abi, compoundLoanInfoAddr);
        web3Exchange = new web3.eth.Contract(ExchangeInterface.abi, oldUniswapWrapperAddr);
        mcdSaverProxy = await MCDSaverProxy.at(mcdSaverProxyAddress);
        shifterRegistry = await ShifterRegistry.at(shifterRegistryAddr);
        daiToken = new web3.eth.Contract(ERC20.abi, makerAddresses["MCD_DAI"]);

    });

    // it('... should buy a token', async () => {

    //     const res = await shifterRegistry.contractAddresses("LOAN_SHIFTER_RECEIVER");

    //     const ethAmount = web3.utils.toWei('2', 'ether');
    //     await web3Exchange.methods.swapEtherToToken(ethAmount, makerAddresses["MCD_DAI"], '0').send({from: accounts[0], value: ethAmount, gas: 800000});

    //     await daiToken.methods.transfer(res, web3.utils.toWei('800', 'ether')).send({from: accounts[0], gas: 200000});

    //     // await send.ether(accounts[0], compoundCreateReceiverAddr, web3.utils.toWei('2', 'ether'));
    // });

    // it('... should merge 2 Vaults of the same type', async () => {

    //     await createVault('ETH_A', web3.utils.toWei('2', 'ether'), web3.utils.toWei('200', 'ether'));
    //     await createVault('ETH_A', web3.utils.toWei('2', 'ether'), web3.utils.toWei('200', 'ether'));

    //     const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
    //     const numVaults = cdpsAfter.ids.length - 1;

    //     const cdp1 = cdpsAfter.ids[numVaults - 1].toString();
    //     const cdp2 = cdpsAfter.ids[numVaults].toString()

    //     const infoBefore = await mcdSaverProxy.getCdpDetailedInfo(cdp2);
    //     console.log(infoBefore.collateral.toString(), infoBefore.debt.toString());

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [nullAddress, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0],
    //      [MCD_PROTOCOL, MCD_PROTOCOL, NO_SWAP, true, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('10', 'ether'), makerAddresses["MCD_DAI"], makerAddresses["MCD_DAI"], mcdEthJoin, mcdEthJoin, cdp1, cdp2]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //      (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdp2);
    //     console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    //     expect(infoAfter.debt.toString() / 1e18).to.be.gt(infoBefore.debt.toString() / 1e18);

    // });

    // it('... should change the collateral type of a CDP', async () => {

    //     await createVault('ETH_A', web3.utils.toWei('2', 'ether'), web3.utils.toWei('200', 'ether'));
    //     await createVault('BAT_A', web3.utils.toWei('3000', 'ether'), web3.utils.toWei('200', 'ether'));

    //     const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
    //     const numVaults = cdpsAfter.ids.length - 1;

    //     const cdp1 = cdpsAfter.ids[numVaults - 1].toString();
    //     const cdp2 = cdpsAfter.ids[numVaults].toString()

    //     const infoBefore = await mcdSaverProxy.getCdpDetailedInfo(cdp1.toString());
    //     console.log('CDP1: ', infoBefore.collateral / 1e18, infoBefore.debt / 1e18);

    //     const infoBefore2 = await mcdSaverProxy.getCdpDetailedInfo(cdp2.toString());
    //     console.log('CDP2: ', infoBefore2.collateral / 1e18, infoBefore2.debt / 1e18);

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [ETH_ADDRESS, BAT_ADDRESS, web3.utils.toWei('2', 'ether'), 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
    //      [MCD_PROTOCOL, MCD_PROTOCOL, COLL_SWAP, true, web3.utils.toWei('2', 'ether'), web3.utils.toWei('200', 'ether'), makerAddresses["MCD_DAI"], makerAddresses["MCD_DAI"], mcdEthJoin, mcdBatJoin, cdp1, cdp2]
    //     ]);

    //     const tx = await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdp2.toString());
    //     console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    //     expect(infoAfter.debt.toString() / 1e18).to.be.gt(infoBefore.debt.toString() / 1e18);
    // });

    // it('... should move a Valut to Compound', async () => {
    //     const type = 'ETH_A';
    //     const collAmount = web3.utils.toWei('2', 'ether');
    //     const debtAmount = web3.utils.toWei('200', 'ether');
    //     const cCollAddr = C_ETH_ADDRESS;
    //     const cDebtAddr = C_DAI_ADDRESS;

    //     const cdpId = await createVault(type, collAmount, debtAmount);

    //     console.log('\nBefore: ');

    //     const mcdDataBefore = await mcdSaverProxy.getCdpDetailedInfo(cdpId.toString());
    //     console.log(`ETH CDP: ${mcdDataBefore.collateral / 1e18} ${type} ${mcdDataBefore.debt / 1e18} Dai`);

    //     const compDataBefore = await getCompData(proxyAddr, [cCollAddr], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataBefore.coll[0] / 1e18).toFixed(2)} ETH ${(compDataBefore.borrow[0] / 1e18).toFixed(2)} Dai`);

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [ETH_ADDRESS, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0],
    //      [MCD_PROTOCOL, COMP_PROTOCOL, NO_SWAP, true, collAmount, debtAmount, makerAddresses["MCD_DAI"], cDebtAddr, mcdEthJoin, cCollAddr, cdpId, 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //         (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     console.log('\nMoved to compound');

    //     console.log('\nAfter:');

    //     const mcdDataAfter = await mcdSaverProxy.getCdpDetailedInfo(cdpId);
    //     console.log(`ETH CDP: ${mcdDataAfter.collateral / 1e18} ${type} ${mcdDataAfter.debt / 1e18} Dai`);

    //     const compDataAfter = await getCompData(proxyAddr, [cCollAddr], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataAfter.coll[0] / 1e18).toFixed(2)} ETH ${(compDataAfter.borrow[0] / 1e18).toFixed(2)} Dai`);

    //     expect(compDataAfter.coll[0] / 1e18).to.be.gt(compDataBefore.coll[0] / 1e18);
    // });

    // must have funds in Compound
    // it('... should move a Compound position to a Vault', async () => {
    //     const type = 'ETH_A';
    //     const moveCollAmount = web3.utils.toWei('0.5', 'ether');
    //     const moveDebtAmount = web3.utils.toWei('100', 'ether');
    //     const cCollAddr = C_ETH_ADDRESS;
    //     const cDebtAddr = C_DAI_ADDRESS;

    //     const cdpId = await createVault(type, web3.utils.toWei('2', 'ether'),  web3.utils.toWei('200', 'ether'));

    //     console.log('\nBefore: ');

    //     const mcdDataBefore = await mcdSaverProxy.getCdpDetailedInfo(cdpId.toString());
    //     console.log(`ETH CDP: ${mcdDataBefore.collateral / 1e18} ${type} ${mcdDataBefore.debt / 1e18} Dai`);

    //     const compDataBefore = await getCompData(proxyAddr, [cCollAddr], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataBefore.coll[0] / 1e18).toFixed(2)} ETH ${(compDataBefore.borrow[0] / 1e18).toFixed(2)} Dai`);

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [ETH_ADDRESS, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0],
    //      [COMP_PROTOCOL, MCD_PROTOCOL, NO_SWAP, false, moveCollAmount, moveDebtAmount, cDebtAddr, makerAddresses["MCD_DAI"], cCollAddr, mcdEthJoin, 0, cdpId]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     console.log(`\nMoved to Vault ${cdpId}`);

    //     console.log('\nAfter:');

    //     const mcdDataAfter = await mcdSaverProxy.getCdpDetailedInfo(cdpId);
    //     console.log(`ETH CDP: ${mcdDataAfter.collateral / 1e18} ${type} ${mcdDataAfter.debt / 1e18} Dai`);

    //     const compDataAfter = await getCompData(proxyAddr, [cCollAddr], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataAfter.coll[0] / 1e18).toFixed(2)} ETH ${(compDataAfter.borrow[0] / 1e18).toFixed(2)} Dai`);



    // });

    //  // must have funds in Compound
    //  it('... should change Compound collateral', async () => {

    //     const moveCollAmount = web3.utils.toWei('0.5', 'ether');
    //     const moveDebtAmount = web3.utils.toWei('100', 'ether');
    //     const cCollAddrBefore = C_ETH_ADDRESS;
    //     const cCollAddrAfter = C_BAT_ADDRESS;
    //     const cDebtAddr = C_DAI_ADDRESS;

    //     const collAddrBefore = ETH_ADDRESS;
    //     const collAddrAfter = BAT_ADDRESS;

    //     console.log('\nBefore: ');
    //     const compDataBefore = await getCompData(proxyAddr, [cCollAddrBefore, cCollAddrAfter], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataBefore.coll[0] / 1e18).toFixed(2)} ETH  ${(compDataBefore.coll[1] / 1e18).toFixed(2)} BAT , ${(compDataBefore.borrow[0] / 1e18).toFixed(2)} Dai`);

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [collAddrBefore, collAddrAfter, moveCollAmount, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
    //      [COMP_PROTOCOL, COMP_PROTOCOL, COLL_SWAP, false, moveCollAmount, moveDebtAmount, cDebtAddr, cDebtAddr, cCollAddrBefore, cCollAddrAfter, 0, 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     console.log(`\nChanged Compound coll`);

    //     console.log('\nAfter:');

    //     const compDataAfter = await getCompData(proxyAddr, [cCollAddrBefore, cCollAddrAfter], [cDebtAddr]);
    //     console.log(`COMP: ${(compDataAfter.coll[0] / 1e18).toFixed(2)} ETH ${(compDataAfter.coll[1] / 1e18).toFixed(2)} BAT,   ${(compDataAfter.borrow[0] / 1e18).toFixed(2)} Dai`);

    // });

    // must have funds in Compound
    it('... should change Compound debt', async () => {
        const cCollAddr = C_ETH_ADDRESS;
        const cDebtAddrBefore = C_DAI_ADDRESS;
        const cDebtAddrAfter = C_USDC_ADDRESS;

        const debtAddrBefore = makerAddresses["MCD_DAI"];
        const debtAddrAfter = USDC_ADDRESS;

        const debtAmountChange = web3.utils.toWei('50', 'ether');
        const depositAmount = web3.utils.toWei('52', 'ether') / 1e12;

        console.log('\nBefore: ');
        const compDataBefore = await getCompData(proxyAddr, [cCollAddr], [cDebtAddrBefore, cDebtAddrAfter]);
        console.log(`COMP: ${(compDataBefore.coll[0] / 1e18).toFixed(2)} ETH  ${(compDataBefore.borrow[0] / 1e18).toFixed(2)} Dai , ${(compDataBefore.borrow[1] / 1e6).toFixed(2)} Usdc`);

        const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
        [
         [debtAddrAfter, debtAddrBefore, depositAmount, debtAmountChange, 0, uniswapWrapperAddr, nullAddress, "0x0", 0],
         [COMP_PROTOCOL, COMP_PROTOCOL, DEBT_SWAP, false, "0", debtAmountChange, cDebtAddrBefore, cDebtAddrAfter, cCollAddr, cCollAddr, 0, 0]
        ]);

        await web3Proxy.methods['execute(address,bytes)']
        (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

        console.log(`\nChanged Compound debt`);

        console.log('\nAfter:');
        const compDataAfter = await getCompData(proxyAddr, [cCollAddr], [cDebtAddrBefore, cDebtAddrAfter]);
        console.log(`COMP: ${(compDataAfter.coll[0] / 1e18).toFixed(2)} ETH  ${(compDataAfter.borrow[0] / 1e18).toFixed(2)} Dai , ${(compDataAfter.borrow[1] / 1e6).toFixed(2)} Usdc`);

    });

    const createVault = async (type, _collAmount, _daiAmount) => {

        let ilk = '0x4554482d41000000000000000000000000000000000000000000000000000000';
        let value = _collAmount;
        let daiAmount = _daiAmount;
        let tokenAddr = '';

        if (type === 'BAT_A') {
            ilk = '0x4241542d41000000000000000000000000000000000000000000000000000000';
            value = '0';
            tokenAddr = BAT_ADDRESS;
        }

        let data = '';

        if (type === 'ETH_A') {
            data = web3.eth.abi.encodeFunctionCall(getAbiFunction(DSSProxyActions, 'openLockETHAndDraw'),
            [makerAddresses['CDP_MANAGER'], makerAddresses['MCD_JUG'], makerAddresses[`MCD_JOIN_${type}`], makerAddresses["MCD_JOIN_DAI"], ilk, daiAmount]);
        } else {
            await approve(web3, tokenAddr, accounts[0], proxyAddr);

            data = web3.eth.abi.encodeFunctionCall(getAbiFunction(DSSProxyActions, 'openLockGemAndDraw'),
            [makerAddresses['CDP_MANAGER'], makerAddresses['MCD_JUG'], makerAddresses[`MCD_JOIN_${type}`], makerAddresses["MCD_JOIN_DAI"], ilk, _collAmount, daiAmount, true]);
        }

    	await proxy.methods['execute(address,bytes)'](makerAddresses['PROXY_ACTIONS'], data, {
            from: accounts[0], value});

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        return cdpsAfter.ids[cdpsAfter.ids.length - 1].toString()
    }

    const getCompRatio = async (addr) => {
        const loanInfo = await web3LoanInfo.methods.getLoanData(addr).call();

        return loanInfo.ratio / 1e6;
    };

    const getCompData = async (proxyAddr, collAddrs, borrowAddrs) => {
        const collLoanInfo = await web3LoanInfo.methods.getTokenBalances(proxyAddr, collAddrs).call();
        const borrowLoanInfo = await web3LoanInfo.methods.getTokenBalances(proxyAddr, borrowAddrs).call();

        return {
            coll: collLoanInfo.balances,
            borrow: borrowLoanInfo.borrows
        }
    };

    const getCompDebt = async (proxyAddr, cAddr) => {
        const loanInfo = await web3LoanInfo.methods.getTokenBalances(proxyAddr, [cAddr]).call();

        return loanInfo.borrows[0] / 1e18;
    };


});
