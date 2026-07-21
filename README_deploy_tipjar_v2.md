# Deploy TipJar V2

This guide summarizes how to deploy and connect the TipJar V2 smart contract to the frontend.

## 1. Compile the Smart Contract

Use Solidity 0.8.x to compile [TipJarV2.sol](TipJarV2.sol).

## 2. Deploy to a Test Network

Deploy the contract to a network such as Sepolia.

## 3. Update the Frontend Address

Copy the deployed contract address into [app.js](app.js) as the `CONTRACT_ADDRESS` value.

## 4. Use the Correct ABI

Make sure the ABI in [app.js](app.js) matches the deployed contract.

## 5. Expected Contract Functions

The frontend expects these functions to be available:

- `registerWaiter(address, string)`
- `removeWaiter(address)`
- `sendTip(address, string)`
- `withdraw()`
- `getWaiter(address)`
- `getWaiters()`
- `getTipsForWaiter(address)`
- `getAllTips()`
- `getContractBalance()`
- `getOwner()`
- `totalTipsReceived()`
- `totalWithdrawn()`
- `waiterCount()`

## 6. Notes

If the frontend throws ABI or function mismatch errors, verify that the deployed contract matches the current Solidity file and that the address is correct.
