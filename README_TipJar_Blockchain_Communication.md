# Tip Jar dApp – Blockchain Communication Guide

See sections below.


## System Architecture

```text
User -> Frontend (HTML/CSS/JS) -> Ethers.js -> MetaMask -> Ethereum (Sepolia) -> Smart Contract
```

### Step 1: User Interaction
The user enters a name, message, and ETH amount, then clicks **Send Tip**.

### Step 2: JavaScript
JavaScript reads the form values and prepares the transaction.

### Step 3: Ethers.js
Ethers.js is the bridge between the frontend and Ethereum.
- Creates the provider
- Gets the signer
- Creates the contract object using the **contract address** and **ABI**

### Step 4: MetaMask
MetaMask:
1. Stores the Ethereum account securely.
2. Signs transactions with the private key.
The private key never leaves MetaMask.

### Step 5: Ethereum Network
After confirmation, MetaMask sends the signed transaction to the Sepolia network.

### Step 6: Smart Contract
Ethereum executes functions like:
- sendTip()
- withdraw()
- getAllTips()
- getBalance()

### Step 7: Response
Ethereum returns a transaction receipt.

### Step 8: UI Update
The frontend reads the latest blockchain data and updates the page.

## Complete Flow

```text
User
 ↓
Clicks Send Tip
 ↓
JavaScript
 ↓
Ethers.js
 ↓
MetaMask
 ↓
Ethereum
 ↓
Smart Contract
 ↓
Transaction Receipt
 ↓
Frontend Updates UI
```

## Read vs Write

### Read
- getAllTips()
- getBalance()
No gas, no MetaMask popup.

### Write
- sendTip()
- withdraw()
Requires gas and MetaMask confirmation.

## Key Concepts

**Ethers.js:** Connects JavaScript to Ethereum.

**MetaMask:** Wallet that signs transactions.

**Contract Address:** The blockchain location of the deployed smart contract.

**ABI (Application Binary Interface):** Describes the contract's functions so JavaScript knows how to call them.

## Closing

My Tip Jar is a decentralized application where the frontend communicates with an Ethereum smart contract through Ethers.js. MetaMask securely signs transactions, Ethereum executes the smart contract, and the frontend retrieves updated blockchain data to display to users.
