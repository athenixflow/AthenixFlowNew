
/**
 * Market Data Service
 * Consumes the secure /api/market proxy (Twelve Data) without exposing keys.
 * The endpoint is auth-gated, so requests carry the Firebase ID token.
 */

import { auth } from "../firebase";

export type MarketType = 'forex' | 'crypto' | 'stock' | 'metals' | 'indices';

export interface MarketDataResponse {
  success: boolean;
  provider?: string;
  type?: string;
  symbol?: string;
  interval?: string;
  price?: number | null;
  values?: any[];
  meta?: any;
  error?: string | any;
}

export const getMarketData = async (
  type: MarketType,
  symbol: string,
  timeframe?: string
): Promise<MarketDataResponse | null> => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

    const intervalParam = timeframe ? `&interval=${encodeURIComponent(timeframe)}` : '';
    const response = await fetch(
      `/api/market?type=${type}&symbol=${encodeURIComponent(symbol)}${intervalParam}`,
      { headers }
    );

    // Guard against non-JSON (HTML error pages, etc.)
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      const text = await response.text();
      return {
        success: false,
        error: `API Error: Expected JSON but received ${contentType || 'unknown'}. Response: ${text.substring(0, 100)}...`
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.error || `HTTP Error ${response.status}: ${response.statusText}` };
    }

    return data;
  } catch (error: any) {
    console.error(`Failed to fetch ${type} data for ${symbol}:`, error);
    return { success: false, error: error.message || "Network connection failed" };
  }
};

export const testMarketConnection = async (): Promise<boolean> => {
  try {
    const result = await getMarketData('forex', 'EURUSD');
    return !!(result && result.success && !result.error);
  } catch (e) {
    return false;
  }
};
