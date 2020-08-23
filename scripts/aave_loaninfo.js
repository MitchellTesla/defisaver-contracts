const Web3 = require('web3');

require('dotenv').config();

const AaveLoanInfo = require('../build/contracts/AaveLoanInfo.json');

const {
    fetchMakerAddresses,
    ETH_ADDRESS
} = require('../test/helper.js');

const aaveLoanInfoAddr = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';

const makerVersion = "1.0.6";
const userAddr = '0x52b398e75eec28a97b115af39a91cbd5a31eef6e';

let aaveLoanInfo, makerAddresses, web3;

const initContracts = async () => {

    makerAddresses = await fetchMakerAddresses(makerVersion);

    web3 = new Web3(new Web3.providers.HttpProvider(process.env.MOON_NET_NODE));

    aaveLoanInfo = new web3.eth.Contract(AaveLoanInfo.abi, aaveLoanInfoAddr);
};


const getRatio = async () => {
    const ratio = await aaveLoanInfo.methods.getRatio(userAddr).call();

    console.log(ratio.toString());

    return;
};

const getPrices = async () => {
    const prices = await aaveLoanInfo.methods.getPrices([makerAddresses["MCD_DAI"], makerAddresses["BAT"], ETH_ADDRESS]).call();

    console.log(prices.toString());

    return;
};

const getCollFactors = async () => {
    const prices = await aaveLoanInfo.methods.getCollFactors([makerAddresses["MCD_DAI"], makerAddresses["BAT"], ETH_ADDRESS]).call();

    console.log(prices.toString());

    return;
};

const getTokensInfo = async () => {
    const prices = await aaveLoanInfo.methods.getTokensInfo([makerAddresses["MCD_DAI"]]).call();

    console.log(prices.toString());

    return;
};

const getFullTokensInfo = async () => {
    const prices = await aaveLoanInfo.methods.getFullTokensInfo([makerAddresses["MCD_DAI"]]).call();

    console.log(prices.toString());

    return;
};

const getLoanData = async () => {
    const loanData = await aaveLoanInfo.methods.getLoanData(userAddr).call();

    console.log(loanData);

    return;
}

const getUserTokenBalances = async () => {
    const resp = await aaveLoanInfo.methods.getTokenBalances(userAddr, [makerAddresses["MCD_DAI"], makerAddresses["BAT"], ETH_ADDRESS]).call();

    console.log(resp);

    return;
}

(async () => {
    await initContracts();

    console.log('ratio');
    await getRatio();

    console.log('prices');
    await getPrices();

    console.log('collFactors');
    await getCollFactors();

    console.log('tokensInfo');
    await getTokensInfo();

    console.log('full info');
    await getFullTokensInfo();

    console.log('user token balances');
    await getUserTokenBalances();

    console.log('loan data');
    await getLoanData();
})();