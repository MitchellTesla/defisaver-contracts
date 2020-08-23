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

const shifterRegistryAddr = '0x988B6CFBf3332FF98FFBdED665b1F53a61f92612';
const loanShifterTakerAddr = '0x180D179Bbf473A30183Fe858E8416351D2170Fd2';

const compoundLoanInfoAddr = '0x4D32ECeC25d722C983f974134d649a20e78B1417';
const comptrollerAddr = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const uniswapWrapperAddr = '0x880A845A85F843a5c67DB2061623c6Fc3bB4c511';
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

    const getCompoundRatio = async (addr) => {
        const loanInfo = await web3LoanInfo.methods.getLoanData(addr).call();

        return loanInfo.ratio / 1e16;
    };

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

    it('... should buy a token', async () => {

        const res = await shifterRegistry.contractAddresses("LOAN_SHIFTER_RECEIVER");

        const ethAmount = web3.utils.toWei('2', 'ether');
        await web3Exchange.methods.swapEtherToToken(ethAmount, makerAddresses["MCD_DAI"], '0').send({from: accounts[0], value: ethAmount, gas: 800000});

        await daiToken.methods.transfer(res, web3.utils.toWei('400', 'ether')).send({from: accounts[0], gas: 200000});

        // await send.ether(accounts[0], compoundCreateReceiverAddr, web3.utils.toWei('2', 'ether'));
    });

    // it('... should merge 2 Vaults of the same type', async () => {

    //     await createVault('ETH');
    //     await createVault('ETH');

    //     const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
    //     const numVaults = cdpsAfter.ids.length - 1;

    //     const cdp1 = cdpsAfter.ids[numVaults - 1].toString();
    //     const cdp2 = cdpsAfter.ids[numVaults].toString()

    //     const infoBefore = await mcdSaverProxy.getCdpDetailedInfo(cdp2);
    //     console.log(infoBefore.collateral.toString(), infoBefore.debt.toString());

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [MCD_PROTOCOL, MCD_PROTOCOL, NO_SWAP, true, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('10', 'ether'), makerAddresses["MCD_DAI"], makerAddresses["MCD_DAI"], mcdEthJoin, mcdEthJoin, cdp1, cdp2],
    //      [nullAddress, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //      (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdp2);
    //     console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    //     expect(infoAfter.debt.toString() / 1e18).to.be.gt(infoBefore.debt.toString() / 1e18);

    // });

    it('... should change the collateral type of a CDP', async () => {

        await createVault('ETH');
        await createVault('BAT');

        const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
        const numVaults = cdpsAfter.ids.length - 1;

        const cdp1 = cdpsAfter.ids[numVaults - 1].toString();
        const cdp2 = cdpsAfter.ids[numVaults].toString()

        const infoBefore = await mcdSaverProxy.getCdpDetailedInfo(cdp2.toString());
        console.log(infoBefore.collateral.toString(), infoBefore.debt.toString());

        const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
        [
         [MCD_PROTOCOL, MCD_PROTOCOL, COLL_SWAP, true, web3.utils.toWei('2', 'ether'), web3.utils.toWei('100', 'ether'), makerAddresses["MCD_DAI"], makerAddresses["MCD_DAI"], mcdEthJoin, mcdBatJoin, cdp1, cdp2],
         [ETH_ADDRESS, BAT_ADDRESS, web3.utils.toWei('2', 'ether'), 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0]
        ]);

        try {
            const tx = await web3Proxy.methods['execute(address,bytes)']
            (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

            console.log(tx);
        } catch (err) {
            console.log(err);
        }

        const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdp2.toString());
        console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

        expect(infoAfter.debt.toString() / 1e18).to.be.gt(infoBefore.debt.toString() / 1e18);

    });

    // it('... should move a CDP to Compound', async () => {

    //     await createVault('ETH');

    //     const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
    //     const numVaults = cdpsAfter.ids.length - 1;

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [MCD_PROTOCOL, COMP_PROTOCOL, NO_SWAP, true, web3.utils.toWei('2', 'ether'), web3.utils.toWei('100', 'ether'), makerAddresses["MCD_DAI"], C_DAI_ADDRESS, mcdEthJoin, C_ETH_ADDRESS, cdpsAfter.ids[numVaults].toString(), 0],
    //      [ETH_ADDRESS, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0]
    //     ]);

    //     const tx = await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     // const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdpsAfter.ids[numVaults].toString());
    //     // console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    // });

    // it('... should move a Compound to Cdp', async () => {

    //     const cdpsAfter = await getCdps.getCdpsAsc(makerAddresses['CDP_MANAGER'], proxyAddr);
    //     const numVaults = cdpsAfter.ids.length - 1;

    //     console.log(cdpsAfter.ids[numVaults].toString());

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [COMP_PROTOCOL, MCD_PROTOCOL, NO_SWAP, false, web3.utils.toWei('1', 'ether'), web3.utils.toWei('50', 'ether'), C_DAI_ADDRESS, makerAddresses["MCD_DAI"], C_ETH_ADDRESS, mcdEthJoin, 0, cdpsAfter.ids[numVaults].toString()],
    //      [ETH_ADDRESS, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     // const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdpsAfter.ids[numVaults].toString());
    //     // console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    // });

    //  it('... should change Compound collateral', async () => {

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [COMP_PROTOCOL, COMP_PROTOCOL, COLL_SWAP, false, web3.utils.toWei('1', 'ether'), web3.utils.toWei('50', 'ether'), C_DAI_ADDRESS, C_DAI_ADDRESS, C_ETH_ADDRESS, C_BAT_ADDRESS, 0, 0],
    //      [ETH_ADDRESS, BAT_ADDRESS, web3.utils.toWei('1', 'ether'), 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    //     // const infoAfter = await mcdSaverProxy.getCdpDetailedInfo(cdpsAfter.ids[numVaults].toString());
    //     // console.log(infoAfter.collateral.toString(), infoAfter.debt.toString());

    // });


    // it('... should change Compound debt', async () => {

    //     const res = await shifterRegistry.contractAddresses("LOAN_SHIFTER_RECEIVER");
    //     const tokenBalance = await getBalance(web3, res, makerAddresses["MCD_DAI"]);
    //     console.log('DAI: ', tokenBalance/ 1e18);

    //     const moveData = web3.eth.abi.encodeFunctionCall(getAbiFunction(LoanShifterTaker, 'moveLoan'),
    //     [
    //      [COMP_PROTOCOL, COMP_PROTOCOL, DEBT_SWAP, false, web3.utils.toWei('1', 'ether'), web3.utils.toWei('50', 'ether'), C_DAI_ADDRESS, C_USDC_ADDRESS, C_ETH_ADDRESS, C_ETH_ADDRESS, 0, 0],
    //      [USDC_ADDRESS, makerAddresses["MCD_DAI"], web3.utils.toWei('55', 'ether') / 1e12, web3.utils.toWei('50', 'ether'), 0, uniswapWrapperAddr, nullAddress, "0x0", 0]
    //     ]);

    //     await web3Proxy.methods['execute(address,bytes)']
    //     (loanShifterTakerAddr, moveData).send({from: accounts[0], gas: 3500000});

    // });

    const createVault  = async (type) => {

        let ilk = '0x4554482d41000000000000000000000000000000000000000000000000000000';
        let value = '0';
        let daiAmount = '0';

        if (type === 'BAT') {
            ilk = '0x4241542d41000000000000000000000000000000000000000000000000000000';
        }

        if (type === 'ETH') {
            value = web3.utils.toWei('2', 'ether');
            daiAmount = web3.utils.toWei('100', 'ether');
        }

    	const data = web3.eth.abi.encodeFunctionCall(getAbiFunction(DSSProxyActions, 'openLockETHAndDraw'),
         [makerAddresses['CDP_MANAGER'], makerAddresses['MCD_JUG'], makerAddresses["MCD_JOIN_ETH_A"], makerAddresses["MCD_JOIN_DAI"], ilk, daiAmount]);

    	await proxy.methods['execute(address,bytes)'](makerAddresses['PROXY_ACTIONS'], data, {
            from: accounts[0], value});
    }


});
