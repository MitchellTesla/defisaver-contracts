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
    ETH_ADDRESS,
    C_ETH_ADDRESS,
    BAT_ADDRESS,
    C_BAT_ADDRESS,
    C_DAI_ADDRESS,
    nullAddress,
} = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const CompoundBasicProxy = contract.fromArtifact('CompoundBasicProxy');
const CompoundFlashLoanTaker = contract.fromArtifact('CompoundFlashLoanTaker');
const CompoundLoanInfo = contract.fromArtifact('CompoundLoanInfo');
const ExchangeInterface = contract.fromArtifact('ExchangeInterface');
const CTokenInterface = contract.fromArtifact('CTokenInterface');
const ComptrollerInterface = contract.fromArtifact('ComptrollerInterface');
const CompoundImportTaker = contract.fromArtifact('CompoundImportTaker');

const compoundBasicProxyAddr = '0x0F1e33A36fA6a33Ea01460F04c6D8F1FAc2186E3';
const compoundLoanInfoAddr = '0x4D32ECeC25d722C983f974134d649a20e78B1417';
const uniswapWrapperAddr = '0x1e30124FDE14533231216D95F7798cD0061e5cf8';
const comptrollerAddr = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const compoundImportAddr = '0xd7418747b8e26cC68FC43cb84dB5999a1dC07051';

const makerVersion = "1.0.6";

describe("Compound-Import", accounts => {
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
        web3Proxy = new web3.eth.Contract(DSProxy.abi, proxyAddr);
        comptroller = new web3.eth.Contract(ComptrollerInterface.abi, comptrollerAddr);
        web3LoanInfo = new web3.eth.Contract(CompoundLoanInfo.abi, compoundLoanInfoAddr);
        web3Exchange = new web3.eth.Contract(ExchangeInterface.abi, uniswapWrapperAddr);

        collToken = ETH_ADDRESS;
        borrowToken = makerAddresses["MCD_DAI"];
        cCollAddr = C_ETH_ADDRESS;
        cBorrowAddr = C_DAI_ADDRESS;

        cCollToken = new web3.eth.Contract(CTokenInterface.abi, cCollAddr);
        cBorrowToken = new web3.eth.Contract(CTokenInterface.abi, cBorrowAddr);

        collAmount = web3.utils.toWei('1', 'ether');
        borrowAmount = web3.utils.toWei('20', 'ether');
    });

    // it('... should buy a token', async () => {
    //     const ethAmount = web3.utils.toWei('5', 'ether');
    //     await web3Exchange.methods.swapEtherToToken(ethAmount, collToken, '0').send({from: accounts[0], value: ethAmount, gas: 800000});

    //     const tokenBalance = await getBalance(web3, accounts[0], collToken);
    //     console.log(tokenBalance/ 1e18);
    //     expect(tokenBalance).to.be.bignumber.is.above('0');
    // });

    // it('... should create a compound position for account', async () => {

    //     let ethValue = 0;
    //     if (collToken === ETH_ADDRESS) {
    //         ethValue = collAmount;
    //     } else {
    //         await approve(web3, collToken, accounts[0], accounts[0]);
    //     }

    //     await comptroller.methods.enterMarkets([cCollAddr, cBorrowAddr]).send({from: accounts[0], gas: 3500000});

    //     // const ethBalanceBefore = await getBalance(web3, accounts[0], C_ETH_ADDRESS);
    //     // const daiBalanceBefore = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);

    //     await cCollToken.methods.mint().send({ from: accounts[0], value: ethValue, gas: 3500000 });
    //     await cBorrowToken.methods.borrow(borrowAmount).send({ from: accounts[0], gas: 3500000 });

    //     const ratio = await getCompoundRatio(accounts[0]);
    //     console.log(`Ratio: `, ratio);

    //     // const ethBalanceAfter = await getBalance(web3, accounts[0], C_ETH_ADDRESS);
    //     // const daiBalanceAfter = await getBalance(web3, accounts[0], makerAddresses["MCD_DAI"]);

    //     expect(ratio).is.above(0);
    // });

    it('... should import a position from account to proxy', async () => {

        const ratioBefore = await getCompoundRatio(proxyAddr);

        await approve(web3, cCollAddr, accounts[0], '0x92ec5a03Fac2E482292eCdD9642a7BF86d6658C3');

        const importData = web3.eth.abi.encodeFunctionCall(getAbiFunction(CompoundImportTaker, 'importLoan'),
         [cCollAddr, cBorrowAddr]);

        await web3Proxy.methods['execute(address,bytes)']
         (compoundImportAddr, importData).send({from: accounts[0], gas: 3500000});

        const ratioAfter = await getCompoundRatio(proxyAddr);
        console.log(`Ratio: `, ratio);

        expect(ratioBefore).not.equal(ratioAfter);

    });


});
