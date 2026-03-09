import { TOKENS } from "./tokens.js";
import { getPrice } from "./api.js";
import { sendWebhook } from "./webhook.js";

let lastPrices = {};
// Allow configuring the interval via environment variables (default 1 second for heartbeat precision)
const INTERVAL_MS = process.env.INTERVAL_MS ? parseInt(process.env.INTERVAL_MS, 10) : 1000;

async function monitor() {
    console.log(`\n[Monitor] Starting cycle at ${new Date().toISOString()}`);

    for (const token of TOKENS) {
        try {
            // Fail-safe: ensure config is valid
            if (!token.address || !token.symbol) {
                console.warn(`[Config Warning] Invalid token configuration found. Skipping.`);
                continue;
            }

            const price = await getPrice(token);

            if (lastPrices[token.symbol]) {
                const oldPrice = lastPrices[token.symbol];

                // Fail-safe: Prevent division by zero and ensure valid numbers
                if (oldPrice > 0 && !isNaN(price)) {
                    const change = ((price - oldPrice) / oldPrice) * 100;

                    if (Math.abs(change) >= 2) {
                        console.log(`[Alert] ${token.symbol} changed by ${change.toFixed(2)}%! (${oldPrice} -> ${price})`);
                        await sendWebhook({
                            token: token.symbol,
                            price,
                            change: parseFloat(change.toFixed(4)),
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            lastPrices[token.symbol] = price;
            console.log(`[Price] ${token.symbol}: $${price}`);

        } catch (e) {
            console.error(`[Monitor Error] Failed to process ${token?.symbol || 'Unknown Token'}: ${e.message}`);
        }
    }

    // --- HEARTBEAT MECHANISM ---
    // Every cycle is a heartbeat. This triggers time-based tasks in agentforge.
    await sendWebhook({
        type: "heartbeat",
        timestamp: new Date().toISOString()
    });

    console.log("[Monitor] Cycle complete (Heartbeat sent).");
}

// Fail-safe: Global error handlers to prevent the node process from crashing unexpectedly
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Process Error] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("[Process Error] Uncaught Exception:", error);
});

// Start the monitor
console.log(`[System] Initializing Price Monitor... Interval: ${INTERVAL_MS}ms`);
monitor();
setInterval(monitor, INTERVAL_MS);
