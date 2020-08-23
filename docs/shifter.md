# [LoanShifterTaker.sol](https://github.com/DecenterApps/defisaver-contracts/blob/master/contracts/compound/create/CompoundCreateTaker.sol)

## Description
Shifter has multiple different use cases:
1. Merge MCD Vaults
2. Change MCD Vault Collateral
3. Move a position between protocols (Mcd, Comp)
4. Change Comp Position collateral asset
5. Change Comp Posistion debt asset

All this actions can be done for a specified amount, so users can for instace only partily move over a vault or they can move over the whole thing all at once.
LoanShifterTaker is called through DSProxy and no aditional approvals are needed.

## Usage

There is only one public function which will be used for all the actions we mentioned called `moveLoan()`

### Function definiton:

`function moveLoan(
        LoanShiftData memory _loanShift,
        SaverExchangeCore.ExchangeData memory _exchangeData
    ) public`

### Params
The first parameter is a struct for the loan related info.

`enum Protocols { MCD, COMPOUND }`

`enum SwapType { NO_SWAP, COLL_SWAP, DEBT_SWAP }`

`struct LoanShiftData {
    Protocols fromProtocol; // Position1 which protocol is in
    Protocols toProtocol; // Position2 which protocol is in
    SwapType swapType; // What kind of swap is needed (for moving a position to diff. protcol NO_SWAP)
    bool wholeDebt; // Do we want do move the whole position
    uint collAmount; // What is the collateral amount we are moving (Position1)
    uint debtAmount; // What is the debt amount we are moving (Position1)
    address debtAddr1; // Debt address of Position1 (mcd - dai, comp - cToken)
    address debtAddr2; // Debt address of Position2 (mcd - dai, comp - cToken)
    address addrLoan1; // collAddress of Position1 (mcd - joinAddr, comp - cToken)
    address addrLoan2; // collAddress of Position2 (mcd - joinAddr, comp - cToken)
    uint id1; // Id of position1 (mcd - cdpId, comp - empty)
    uint id2; // Id of position2 (mcd - cdpId, comp - empty)
}`

The second parameter is the standard DFS exchange struct.

`struct ExchangeData {
    address srcAddr; // Address of source token
    address destAddr; // Address of destination
    uint srcAmount; // Amount of token we are selling
    uint destAmount; // Amount of token we are buying
    uint minPrice; // minimum exceptable price
    address wrapper; // on-chain exchange wrapper
    address exchangeAddr; // 0x exchange address
    bytes callData; // 0x price data
    uint256 price0x; // 0x price
}`

## Examples



### Merge Vaults

    coll - 0.1 Eth (Vault collateral)
    debt -  20 Dai (Vault debt)
    wholeAmount - true (Is it the whole vault)

Call data:

`[
    [MCD, MCD, NO_SWAP, wholeAmount, coll, debt, Dai, mcdEthJoin, mcdEthJoin, cdpId1, cdpId2],
    [nullAddress, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0]
 ]`

### Change Vault Collateral

    Move from ETH/DAI -> BAT/DAI

    coll - 0.1 Eth (Vault collateral)
    debt -  20 Dai (Vault debt)
    wholeAmount - true (Is it the whole vault)

Call data:
`[
    [MCD, MCD, COLL_SWAP, wholeAmount, coll, debt, Dai mcdEthJoin, mcdBatJoin, cdpId1, cdpId2],
    [Eth, Bat, coll, 0, 0, uniswapWrapperAddr, ZERO_ADDRESS, "0x0", 0]
 ]`

### Change Comp Collateral

    Move from ETH/DAI Comp -> Bat/Dai Comp

    coll - 0.1 Eth (Comp collateral)
    debt -  20 Dai (Comp debt)
    wholeAmount - true (Is it the whole position)

Call data:
`[
[   COMP, COMP, COLL_SWAP, wholeAmount, coll, debt, cDai, cDai, cEth, cBat, 0, 0],
    [Eth, Bat, coll, 0, 0, uniswapWrapperAddr, nullAddress, "0x0", 0]
 ]`

### Change Comp Debt

    Move from ETH/DAI Comp -> ETH/USDC Comp

    coll - 0.1 Eth (Comp collateral)
    debt -  20 Dai (Comp debt)
    wholeAmount - true (Is it the whole position)
    srcAmount - 22 USDC (Estimate of how much USDC is needed for 20 DAI)

Call data:
`[
    [COMP, COMP, DEBT_SWAP, coll, debt, cDai, cUSDC, cETH, cETH, 0, 0],
    [Usdc, Dai, srcAmount, debt, 0, uniswapWrapperAddr, nullAddress, "0x0", 0]
 ]`

### Move Mcd -> Comp

    Move from ETH/DAI Vault -> ETH/DAI Comp

    coll - 0.1 Eth (Vault collateral)
    debt -  20 Dai (Vault debt)
    wholeAmount - true (Is it the whole vault)

**Notice that even though we have NO_SWAP coll token of Position1 needs to be specified in Exchange struct**

Call data:
`[
    [MCD, COMP, NO_SWAP, wholeAmount, coll, debt, Dai, cDai, mcdEthJoin, cETH, cdpId, 0],
    [ETH_ADDRESS, nullAddress, 0, 0, 0, nullAddress, nullAddress, "0x0", 0]
]`

## Deployed Address

### LoanShifterTaker - [TBD]
