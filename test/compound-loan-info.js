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
    C_REP_ADDRESS,
    C_DAI_ADDRESS,
    nullAddress,
} = require('./helper.js');

const DSProxy = contract.fromArtifact("DSProxy");
const ProxyRegistryInterface = contract.fromArtifact("ProxyRegistryInterface");
const CompoundLoanInfo = contract.fromArtifact('CompoundLoanInfo');
const AllowanceProxy = contract.fromArtifact("AllowanceProxy");
const CompoundSaverHelper = contract.fromArtifact("CompoundSaverHelper");

const compoundLoanInfoAddr = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601';
const compoundSaverHelperAddr = '0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66';

const makerVersion = "1.0.6";

describe("Compound-Loan-Info", accounts => {
    let registry, proxy, proxyAddr, makerAddresses,
        web3LoanInfo, collToken, cCollToken, borrowToken, cBorrowToken;

    const getCompoundRatio = async (userAddr) => {
        const ratio = await web3LoanInfo.methods.getRatio(userAddr).call();

        return ratio / 1e16;
    };

    const getLoanData = async (userAddr) => {
        let loanData = await web3LoanInfo.methods.getLoanData(userAddr).call();

        // const data = {};

        // data.collUsd = loanData.collAmounts[0] / 1e18;
        // data.borrowUsd = loanData.borrowAmounts[0] / 1e18;

        return loanData;
    };

    const getMaxBorrow = async (cAddr, userAddr) => {
        const ratio = await web3CompoundSaverHelper.methods.getMaxBorrow(cAddr, userAddr).call();

        return ratio / 1e18;
    };

    const getMaxColl = async (cAddr, userAddr) => {
        const ratio = await web3CompoundSaverHelper.methods.getMaxCollateral(cAddr, userAddr).call();

        return ratio / 1e18;
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
        web3LoanInfo = new web3.eth.Contract(CompoundLoanInfo.abi, compoundLoanInfoAddr);
        web3CompoundSaverHelper = new web3.eth.Contract(CompoundSaverHelper.abi, compoundSaverHelperAddr);
    });

    it('... should check saftey ratio', async () => {

        let userAddr = '0x8c4aDc1589B96d56b7A351e6E500163AE208D53b';

        // const ratio = await getCompoundRatio(userAddr);
        // console.log(ratio);

        // const loanData = await getLoanData(userAddr);
        // console.log(loanData);

        const maxBorrow = await getMaxBorrow(C_DAI_ADDRESS, userAddr);
        console.log(maxBorrow);

        const maxColl = await getMaxColl(C_REP_ADDRESS, userAddr);
        console.log(maxColl);
        // 2942177568783433369
        // 7355443921958583424

    });



});
