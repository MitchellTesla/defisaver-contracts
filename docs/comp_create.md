# [CompoundCreateTaker.sol](https://github.com/DecenterApps/defisaver-contracts/blob/master/contracts/compound/create/CompoundCreateTaker.sol)

## Description

A user should be able to easily open up a leverage position long ot short by using this contract.
Contract uses Aave flash loans to borrow for extra leverage.
Contract is called through DSProxy and if a user is despositing a token, it first has to approve DSProxy to pull that token.

## Usage

There is only one public function which will be used to create a leverage short/long position called `openLeveragedLoan()`

### Function definiton:

`function openLeveragedLoan(
        CreateInfo memory _createInfo,
        SaverExchangeCore.ExchangeData memory _exchangeData,
        address payable _compReceiver
    ) public payable`

### Params
The first parameter is a struct for the create related info.

   `struct CreateInfo {
        address cCollAddress; // collateral address must be compound token (cEth for example)
        address cBorrowAddress; // borrow address of token (cDai for example)
        uint depositAmount; // users deposit amount (if we are using Eth, must be same as ether sent)
    }`

The second parameter is the standard DFS exchange struct.

`struct ExchangeData {
    address srcAddr; // Address of token which we are selling
    address destAddr; // Address of token which we are buying
    uint srcAmount; // Amount of token we are selling
    uint destAmount; // Amount of token we are getting (pass in 0 as we don't know exactly how much we'll get)
    uint minPrice; // minimum exceptable price
    address wrapper; // on-chain exchange wrapper
    address exchangeAddr; // 0x exchange address
    bytes callData; // 0x price data
    uint256 price0x; // 0x price
}`

And the third parameter is the address of the Receiver contract

`address payable _compReceiver // Address of CompoundReceiver.sol`

## Examples

**Long Eth/Dai**

    Deposit: 1 Eth, Borrow 100 Dai

    depositAmount - 1 Eth (sent as value param also)
    borrowAmount - 100 Dai

Call data:
`[[cEth, cDai, depositAmount], [Dai, Eth, borrowAmount, 0, 0, uniswapWrapperAddr, ZERO_ADDRESS, "0x0", 0], compoundCreateReceiverAddr]`

**Short Eth/Dai**

    Deposit: 100 Dai, Borrow 0.1 Eth

    depositAmount - 100 Dai
    borrowAmount - 0.1 Eth

Call data:
`[[cDai, cEth, depositAmount], [Eth, Dai, borrowAmount, 0, 0, uniswapWrapperAddr, ZERO_ADDRESS, "0x0", 0], compoundCreateReceiverAddr]`

## Deployed Address

### CompoundCreateTaker - [TBD]
### CompoundCreateReceiver - [TBD]
