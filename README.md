# 🧑‍💻 GiG Economy

[![Built with Arbitrum Stylus](https://img.shields.io/badge/Built%20on-Arbitrum%20Stylus-blue)](https://developer.arbitrum.io/stylus) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)  

A **decentralized gig economy dApp** built on **Arbitrum Stylus**, enabling users to post micro-tasks (e.g., “design a logo,” “translate a sentence”) with ETH or test tokens as bounties.

- Funds are locked in **escrow** via a Rust smart contract.
- Showcases **low gas costs**, **Rust memory safety**, and **EVM compatibility**.

## 📌 Project Overview

### Purpose
Demonstrate Arbitrum Stylus’s efficiency for micro-transactions in a decentralized gig economy.

### Features
- Create tasks with bounties
- Submit work
- Approve or dispute submissions
- Withdraw funds

### Tech Stack
- **Backend**: Rust smart contract (Stylus SDK, WASM)
- **Frontend**: React + ethers.js
- **Testnet**: Arbitrum Sepolia

---

### Dependencies
- Stylus SDK → `stylus-sdk-rs`
- Cargo Stylus CLI → `cargo install cargo-stylus`
- Foundry → `curl -L https://foundry.paradigm.xyz | bash`
- npm → for React dependencies

### Testnet
- Arbitrum Sepolia (get test ETH from [Alchemy Faucet](https://sepoliafaucet.com/))

---

## ⚙️ Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/sogobanwo/GiG_Economy
cd GiG_Economy
```

### Smart Contract Setup
```bash
cd contract
cargo build --release
cargo install cargo-stylus
cargo stylus check
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Testnet Configuration
Add Arbitrum Sepolia to MetaMask:
- **Network Name**: Arbitrum Sepolia
- **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
- **Chain ID**: 421614
- **Currency Symbol**: ETH

Fund wallets with Sepolia ETH from a faucet.

---

## 📜 Smart Contract

### Language
- Rust (compiled to WASM for Stylus)

### Functions
- `create_task(bounty, description)`: Creates a task and locks the bounty in escrow.
- `submit_task(task_id, submission)`: Completer submits work (URL/text).
- `approve_task(task_id)`: Creator approves, releasing the payout.
- `dispute_task(task_id)`: Creator disputes, blocking the payout.
- `withdraw(task_id)`: Refunds creator if task is uncompleted or disputed.

### Events
- `TaskCreated(task_id, creator, bounty, description)`
- `TaskSubmitted(task_id, completer, submission)`
- `TaskApproved(task_id, completer)`
- `TaskDisputed(task_id)`

### Security
- Rust memory safety prevents reentrancy and overflow.
- Validation ensures non-zero bounties and valid task IDs.

---

## 🎨 Frontend

### Framework
- React

### Features
- Task creation form (description + bounty)
- Task list (ID, description, bounty, status)
- Task submission form (work URL)
- Approval/dispute buttons for creators
- Wallet connection via MetaMask

### Libraries
- `ethers.js`: For contract interaction
- `MetaMask`: For wallet connection and signing

---

## 🚀 Deployment

### Deploy Contract
```bash
cd contract
cargo stylus deploy --network sepolia --private-key <your-private-key>
```

### Verify on Arbiscan
- Use [Sepolia Arbiscan](https://sepolia.arbiscan.io/) to verify the deployed contract.

### Configure Frontend
Update `frontend/src/config.js`:
```javascript
export const CONTRACT_ADDRESS = "<deployed-contract-address>";
export const CONTRACT_ABI = [...]; // ABI from compilation
```

### Run Frontend
```bash
cd frontend
npm start
```
Access the app at: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Usage Example

### Create a Task
1. Connect MetaMask to Sepolia network.
2. Enter task description and bounty (e.g., 0.01 ETH).
3. Confirm transaction.

### Submit a Task
1. Select a task from the list (e.g., Task ID 1).
2. Submit work (URL/text).
3. Confirm transaction.

### Approve or Dispute
- **Approve**: Creator approves, releasing the bounty.
- **Dispute**: Creator disputes, blocking the payout.

### Withdraw Funds
- If task is uncompleted or disputed, creator can reclaim the bounty.

---

## 🧪 Testing

### Test Cases
- Create task with valid and invalid bounty.
- Submit task and verify escrow balance.
- Approve task and confirm payout.
- Dispute task and verify payout blocked.
- Withdraw funds for uncompleted tasks.

### Run Tests
```bash
cd contract
forge test
```

---

## 🎥 Demo

- **Video Demo**: *(2-minute walkthrough)* → `#`
- **Contract Verified**: [Arbiscan Link](https://sepolia.arbiscan.io/address/<contract-address>)

### Sample Flow
1. **User A** creates a task → “Translate a sentence” with **0.01 ETH** bounty.
2. **User B** submits work → `https://example.com/translation.txt`.
3. **User A** approves the submission → **User B** receives **0.01 ETH**.

---

## ⚠️ Limitations

- Disputes can be flagged but not resolved (MVP limitation).
- Only one submission allowed per task.
- UI is minimal (focus on functionality).
- Supports only ETH/test tokens (no ERC-20 support yet).

---

## 🔮 Future Enhancements

- Add DAO or third-party arbitration for dispute resolution.
- Enable ERC-20 token support.
- Add task search, filtering, and category options.
- Introduce user profiles with reputation scores.
- Improve UI/UX with a mobile-friendly, polished design.

---

## 📚 Resources

- [Arbitrum Stylus Quickstart](https://github.com/OffchainLabs/stylus)
- [Stylus SDK](https://github.com/OffchainLabs/stylus-sdk-rs)
- [Arbitrum Docs](https://developer.arbitrum.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Arbitrum Discord](https://discord.gg/arbitrum) → join **#stylus** channel for support

---

## 👥 Team

- **Developer 1** → Oladele Banjo
- **Developer 2** → Arowolo Kehinde
- **Developer 3** → Banwo Olorunsogo

---

## 📄 License

This project is licensed under the **MIT License**.
