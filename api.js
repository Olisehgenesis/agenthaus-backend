import axios from "axios";

export async function getDexPrice(address) {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    const res = await axios.get(url, { timeout: 5000 });
    if (!res.data || !res.data.pairs || res.data.pairs.length === 0) {
        throw new Error("No pairs found on DexScreener");
    }
    const price = parseFloat(res.data.pairs[0].priceUsd);
    if (isNaN(price)) {
        throw new Error("DexScreener returned an invalid price format");
    }
    return price;
}

export async function getCoinGeckoPrice(address) {
    const url = `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=${address}&vs_currencies=usd`;
    const res = await axios.get(url, { timeout: 5000 });
    const data = res.data[address.toLowerCase()];
    if (!data || !data.usd) {
        throw new Error("No price found on CoinGecko");
    }
    const price = parseFloat(data.usd);
    if (isNaN(price)) {
        throw new Error("CoinGecko returned an invalid price format");
    }
    return price;
}

export async function getPrice(token) {
    const apis = [
        () => getDexPrice(token.address),
        () => getCoinGeckoPrice(token.address)
    ];

    let lastError = null;
    for (const api of apis) {
        try {
            return await api();
        } catch (e) {
            lastError = e;
            console.warn(`[API Warning] Request failed for ${token.symbol} → trying fallback API. (${e.message})`);
        }
    }

    throw new Error(`All APIs failed for token ${token.symbol}. Last error: ${lastError?.message}`);
}
