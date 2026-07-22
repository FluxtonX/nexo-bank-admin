import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge.
 * Prevents Tailwind class conflicts in dynamic component styling.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with locale-aware separators and optional compact notation.
 */
export function formatNumber(
  value: number,
  compact = false
): string {
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Formats a number as a currency string.
 */
export function formatCurrency(
  value: number,
  currency = "USD",
  compact = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

/**
 * Formats a Date object or ISO string to a readable date/time string.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Returns relative time string (e.g. "2 hours ago").
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/**
 * Truncates a string to a given maximum length, appending "…".
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generates initials from a full name string (up to 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * Delays execution for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamps a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Symbol to CoinGecko ID mapping
export const SYMBOL_TO_COIN_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  FIL: "filecoin",
  TRX: "tron",
  ETC: "ethereum-classic",
  XMR: "monero",
  EOS: "eos",
  IOTA: "iota",
  NEO: "neo",
  DASH: "dash",
  ZEC: "zcash",
  CAD: "canadian-dollar", // Fallback for CAD
};

// Coin colors for UI
export const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  USDT: "#26A17B",
  USDC: "#2775CA",
  SOL: "#00FFA3",
  BNB: "#F3BA2F",
  XRP: "#23292F",
  DOGE: "#C2A633",
  ADA: "#0033AD",
  AVAX: "#E84142",
  DOT: "#E6007A",
  MATIC: "#8247E5",
  LINK: "#2A5ADA",
  UNI: "#FF007A",
  ATOM: "#2E3148",
  LTC: "#345D9D",
  BCH: "#8DC351",
  XLM: "#14B6E7",
  ALGO: "#1B2C4E",
  VET: "#15B8E6",
  FIL: "#0090FF",
  TRX: "#EF0027",
  ETC: "#3CC8D8",
  XMR: "#FF6600",
  EOS: "#000000",
  IOTA: "#131F37",
  NEO: "#00C5D7",
  DASH: "#008DE4",
  ZEC: "#F4B731",
  CAD: "#1650AB",
};

let cachedRates: Record<string, number> | null = null;
let lastFetchTime = 0;

export async function fetchLiveCADRates(symbols?: string[]): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Check if we have cached rates and if they're fresh (< 60s)
  // Only use cache if no specific symbols are requested (global fetch)
  if (cachedRates && now - lastFetchTime < 60000 && !symbols) {
    return cachedRates;
  }
  
  // If specific symbols are requested, always fetch fresh data
  // to ensure we get live rates and not fallback values

  try {
    // If symbols provided, fetch only those; otherwise fetch common ones
    const coinIds = symbols 
      ? symbols.map(s => SYMBOL_TO_COIN_ID[s.toUpperCase()] || s.toLowerCase())
      : Object.values(SYMBOL_TO_COIN_ID).slice(0, 10); // Limit to top 10 by default
    
    const uniqueIds = [...new Set(coinIds)].join(",");
    
    const coinGeckoRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=cad`
    );
    const coinGeckoData = await coinGeckoRes.json();

    // If we had cached rates, merge them with fresh data
    // Otherwise start fresh
    if (!cachedRates) {
      cachedRates = {};
    }
    
    // Map CoinGecko IDs back to symbols
    Object.entries(SYMBOL_TO_COIN_ID).forEach(([symbol, coinId]) => {
      if (coinGeckoData[coinId]?.cad) {
        cachedRates![symbol] = coinGeckoData[coinId].cad;
      }
    });

    // Default fallback rates for common coins
    const defaultRates: Record<string, number> = {
      BTC: 95000,
      ETH: 3500,
      USDT: 1.36,
      USDC: 1.36,
      SOL: 150,
      BNB: 600,
      XRP: 1.5,
      DOGE: 0.15,
      ADA: 0.5,
      CAD: 1,
    };

    Object.entries(defaultRates).forEach(([symbol, rate]) => {
      if (!cachedRates![symbol]) {
        cachedRates![symbol] = rate;
      }
    });

    lastFetchTime = now;
  } catch (error) {
    console.error("Failed to fetch live CAD rates, using defaults", error);
    if (!cachedRates) {
      cachedRates = {
        BTC: 95000,
        ETH: 3500,
        USDT: 1.36,
        USDC: 1.36,
        SOL: 150,
        BNB: 600,
        XRP: 1.5,
        DOGE: 0.15,
        ADA: 0.5,
        CAD: 1,
      };
    }
  }

  return cachedRates!;
}

