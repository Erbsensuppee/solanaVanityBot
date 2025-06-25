require('dotenv').config();
const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const axios = require('axios');

const TARGET_PREFIX = process.env.TARGET_PREFIX;
const PARTIAL_PREFIXES = process.env.PARTIAL_PREFIXES.split(',').map(p => p.trim());

let attempts = 0;
const startTime = Date.now();
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function notifyTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: 'Markdown'  // ⬅️ Wichtig für fette Schrift und Monospace
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

    // 📌 Teilpräfix-Treffer speichern
    for (const prefix of PARTIAL_PREFIXES) {
      if (publicKey.startsWith(prefix)) {
        const filename = `wallet_${prefix}_${Date.now()}.json`;
        const walletData = {
          prefix: prefix,
          publicKey: publicKey,
          secretKeyBase58: secretKeyBase58,
          attempts: attempts,
          durationSeconds: parseFloat(duration)
        };
        fs.writeFileSync(filename, JSON.stringify(walletData, null, 2));
        console.log(`💾 Partial match (${prefix}) saved to ${filename}`);


        // ✨ Telegram-Meldung für jeden Treffer
        const isFullMatch = prefix === TARGET_PREFIX;
        const emoji = isFullMatch ? "✅" : "✨";
        const label = isFullMatch ? "Volltreffer" : "Teiltreffer";

        console.log(`${emoji} ${label} mit ${prefix} nach ${attempts} Versuchen!`);

        await notifyTelegram(
        `${emoji} *${label} gefunden!*\n\n` +
        `*Prefix:* \`${prefix}\`\n` +
        `*Public:* \`${publicKey}\`\n` +
        `*Versuche:* ${attempts.toLocaleString()}\n` +
        `*Dauer:* ${duration}s`
        );
      }
    }

    // 📈 Fortschrittsanzeige
    if (attempts % 100000 === 0) {
      console.log(`🔁 ${attempts} attempts in ${duration}s`);
    }

    // 📨 Fortschrittsmeldung an Telegram
    if (attempts % 1000000 === 0) {
      await notifyTelegram(
        `⏳ Vanity-Wallet Suche...\nVersuche: ${attempts}\nDauer: ${duration}s`
      );
    }
  }
}

generateVanityAddress();
