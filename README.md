# 🔑 Solana Vanity Wallet Generator

A simple Node.js script to generate vanity wallets for the Solana blockchain — with automatic Telegram notifications for prefix matches.

---

## 🚀 Features

- Generates random Solana wallets
- Detects and stores wallets that start with specific prefixes (e.g. `MAR`, `MARI`, `MARIO`)
- Sends Telegram messages on partial and full matches
- Progress update every 1,000,000 attempts
- Saves matching wallets as `.json` files

---

## ⚙️ Installation

```bash
git clone https://github.com/Erbsensuppee/solanaVanityBot.git
cd solana-vanity-bot

# Install required dependencies
npm install dotenv @solana/web3.js bs58 axios

# Quick PR test Sun 27 Jul 15:17:52 CEST 2025
# YOLO test commit
# YOLO test commit
# YOLO test commit
