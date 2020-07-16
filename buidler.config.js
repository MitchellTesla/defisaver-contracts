usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("buidler-ethers-v5");
usePlugin("@nomiclabs/buidler-solhint");

const dotenv           = require('dotenv').config();

module.exports = {
    networks: {
        buidlerevm: {
        },
        moonnet: {
            url: process.env.MOON_NET_NODE,
            accounts: ['0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d']
        },
        mainnet: {
            url: process.env.ALCHEMY_NODE,
            accounts: [process.env.PRIV_KEY_OWNER]
        },
        kovan: {
            url: process.env.KOVAN_INFURA_ENDPOINT,
            accounts: [process.env.PRIV_KEY_KOVAN]
        },
    },
    solc: {
        version: "0.6.6",
        optimizer: {
            enabled: true,
            runs: 20000
        }
    },
    etherscan: {
        url: "https://api.etherscan.io/api",
        apiKey: process.env.ETHERSCAN_API_KEY
    }
};
