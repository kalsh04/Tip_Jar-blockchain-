# TipJar V2

A polished decentralized tipping application built on Ethereum, where customers can tip waiters, waiters can withdraw their earnings, and managers can manage waiter registration.

TipJar V2 brings the original idea into a full Web3 experience with MetaMask integration, Solidity smart contracts, and a clean role-based frontend.

## ✨ Features

- Customer experience for sending tips to registered waiters
- Waiter dashboard to view received tips and withdraw earnings
- Manager panel to register or remove waiters
- Real-time wallet connection through MetaMask
- Smart contract-powered balances and tip history on Ethereum
- Built with plain HTML, CSS, JavaScript, ethers.js, and Solidity

## 🧠 What This Project Does

TipJar V2 lets users interact with a smart contract deployed on Ethereum-compatible networks. The frontend communicates with the blockchain through ethers.js, while MetaMask handles wallet signing and transaction confirmation.

### Roles in the App

- Customer: Select a waiter and send a tip
- Waiter: View tips received and withdraw accumulated funds
- Manager: Register and remove waiters

## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript
- Web3 Library: ethers.js
- Wallet: MetaMask
- Smart Contract: Solidity 0.8.x
- Network: Sepolia (recommended for testing)

## 📁 Project Structure

- [index.html](index.html) — Main user interface
- [style.css](style.css) — Styling for the app
- [app.js](app.js) — Web3 interaction and UI logic
- [TipJarV2.sol](TipJarV2.sol) — Smart contract implementation
- [README_deploy_tipjar_v2.md](README_deploy_tipjar_v2.md) — Deployment notes

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd TipJar
```

### 2. Install a local server

Since this is a frontend dApp, it is best to serve the project locally.

Example with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### 3. Connect MetaMask

- Install MetaMask
- Switch to the correct Ethereum test network
- Connect your wallet to the app
- Make sure the contract address in [app.js](app.js) matches your deployed contract

## 🔐 Smart Contract

The contract logic lives in [TipJarV2.sol](TipJarV2.sol) and includes:

- waiter registration
- tip sending
- balance tracking
- withdrawals
- waiter listing and management
- owner controls

## 📦 Deployment Notes

1. Compile [TipJarV2.sol](TipJarV2.sol)
2. Deploy it to Sepolia
3. Update the deployed contract address in [app.js](app.js)
4. Confirm the ABI matches the deployed contract

## 💡 Example Flow

1. Connect MetaMask
2. Choose a role: customer, waiter, or manager
3. Interact with the smart contract
4. View updated balances and tip activity on the frontend

## 📌 Notes

This project is a great example of a simple but complete Web3 frontend integrated with Ethereum smart contracts. It is ideal for learning, portfolio showcases, and further extension into more advanced DeFi or social tipping experiences.

---

