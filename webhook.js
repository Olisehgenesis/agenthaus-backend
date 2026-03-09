import axios from "axios";

// Environment variable for Webhook URL, fail-safe so it doesn't crash if unset
const WEBHOOK_URL = process.env.WEBHOOK_URL;

export async function sendWebhook(data) {
    if (!WEBHOOK_URL || WEBHOOK_URL === "https://your-webhook-url.com") {
        console.warn("[Webhook Warning] WEBHOOK_URL is not configured properly in the environment. Skipping alert for", data.token);
        return;
    }

    try {
        await axios.post(WEBHOOK_URL, data, {
            timeout: 5000,
            headers: {
                'x-webhook-secret': 'ugandaisfake'
            }
        });
        console.log(`[Webhook Success] Heartbeat/Alert sent for ${data.token || 'system'}`);
    } catch (e) {
        console.error(`[Webhook Error] Failed to send webhook for ${data.token}:`, e.message);
    }
}
