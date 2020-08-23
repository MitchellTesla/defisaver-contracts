const path = require("path");

const dotenv           = require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = process.env.ETHEREUM_ACCOUNT_MNEMONIC;

module.exports = {
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  plugins: [
    'truffle-plugin-verify',
    '@chainsafe/truffle-plugin-abigen'
  ],
  networks: {
    mainnet: {
        provider: function() {
            return new HDWalletProvider(mnemonic, process.env.ALCHEMY_NODE);
        },
        network_id: '1',
        gasPrice: 45100000000, // 8.1 gwei
        skipDryRun: true,
    },
    kovan: {
        provider: function() {
            return new HDWalletProvider(mnemonic, process.env.KOVAN_INFURA_ENDPOINT, 0, 15);
        },
        network_id: '42',
        gas: 8000000,
        gasPrice: 3000000000,
        // skipDryRun: true,
    },
    moonnet: {
        provider: function() {
            return new HDWalletProvider('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', process.env.MOON_NET_NODE);
        },
        network_id: '1',
        gas: 6700000,
        gasPrice: 3000000000,
        skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.6.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 20000
        },
      }
    }
  }
}
