require('dotenv').config();
const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const axios = require('axios');

const TARGET_PREFIX = process.env.TARGET_PREFIX;

const PARTIAL_PREFIXES = process.env.PARTIAL_PREFIXES
  ? process.env.PARTIAL_PREFIXES.split(',').map(p => p.trim().toUpperCase())
  : [];

const PARTIAL_END_PREFIXES = process.env.PARTIAL_END_PREFIXES
  ? process.env.PARTIAL_END_PREFIXES.split(',').map(s => s.trim())
  : [];

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let attempts = 0;
const startTime = Date.now();

async function notifyTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    });
    console.log("📨 Telegram-Nachricht gesendet");
  } catch (err) {
    console.error("⚠️  Telegram-Sendefehler:", err.message);
  }
}

async function generateVanityAddress() {
  await notifyTelegram("🚀 Vanity-Wallet Suche gestartet...");

  while (true) {
    const keypair = solanaWeb3.Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKeyBase58 = bs58.default.encode(keypair.secretKey);
    attempts++;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationHours = ((Date.now() - startTime) / (1000 * 60 * 60)).toFixed(4);

    const publicKeyUpper = publicKey.toUpperCase();
    const publicKeyLower = publicKey;

    // ✅ Check PREFIXES (startsWith)
    for (const prefix of PARTIAL_PREFIXES) {
      if (publicKeyUpper.startsWith(prefix)) {
        const walletData = {
          match: `start:${prefix}`,
          publicKey,
          secretKeyBase58,
          attempts,
          durationHours: parseFloat(durationHours)
        };

        const filename = `wallet_START_${prefix}.jsonl`;
        fs.appendFileSync(filename, JSON.stringify(walletData) + "\n");

        console.log(`💾 Match (START: ${prefix}) -> ${filename}`);

        const isFullMatch = prefix === TARGET_PREFIX?.toUpperCase();
        const emoji = isFullMatch ? "✅" : "✨";
        const label = isFullMatch ? "Volltreffer (Start)" : "Teiltreffer (Start)";

        await notifyTelegram(
          `${emoji} *${label} gefunden!*\n\n` +
          `*Prefix:* \`${prefix}\`\n` +
          `*Public:* \`${publicKey}\`\n` +
          `*Versuche:* ${attempts.toLocaleString()}\n` +
          `*Dauer:* ${durationHours}h`
        );
      }
    }

    // ✅ Check SUFFIXES (endsWith)
    for (const suffix of PARTIAL_END_PREFIXES) {
      if (publicKeyLower.endsWith(suffix)) {
        const walletData = {
          match: `end:${suffix}`,
          publicKey,
          secretKeyBase58,
          attempts,
          durationHours: parseFloat(durationHours)
        };

        const filename = `wallet_END_${suffix.toUpperCase()}.jsonl`;
        fs.appendFileSync(filename, JSON.stringify(walletData) + "\n");

        console.log(`💾 Match (END: ${suffix}) -> ${filename}`);

        const emoji = "✨";
        const label = "Teiltreffer (Ende)";
        await notifyTelegram(
          `${emoji} *${label} gefunden!*\n\n` +
          `*Suffix:* \`${suffix}\`\n` +
          `*Public:* \`${publicKey}\`\n` +
          `*Versuche:* ${attempts.toLocaleString()}\n` +
          `*Dauer:* ${durationHours}h`
        );
      }
    }

    if (attempts % 100000 === 0) {
      console.log(`🔁 ${attempts} Versuche in ${duration}s`);
    }

    if (attempts % 10000000 === 0) {
      await notifyTelegram(
        `⏳ Vanity-Wallet Suche...\nVersuche: ${attempts}\nDauer: ${durationHours}h`
      );
    }
  }
}

generateVanityAddress();
