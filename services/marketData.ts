
/**
 * Market Data Service
 * Consumes the secure /api/market proxy to fetch data without exposing keys.
 */

export interface MarketDataResponse {
  success: boolean;
  rates?: Record<string, number>;
  data?: any[];
  error?: string;
}

export const getMarketData = async (type: 'forex' | 'stock', symbol: string): Promise<MarketDataResponse | null> => {
  try {
    const response = await fetch(`/api/market?type=${type}&symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Market API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${type} data for ${symbol}:`, error);
    return null;
  }
};
