
/**
 * Market Data Service
 * Consumes the secure /api/market proxy to fetch data without exposing keys.
 */

export interface MarketDataResponse {
  success: boolean;
  rates?: Record<string, number>;
  data?: any[];
  error?: string | any;
}

export const getMarketData = async (type: 'forex' | 'stock', symbol: string): Promise<MarketDataResponse | null> => {
  try {
    const response = await fetch(`/api/market?type=${type}&symbol=${symbol}`);
    
    // Check if response is JSON (prevents crashing on HTML 404/500 pages in local dev)
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      console.warn("Market API returned non-JSON response. If running locally, use 'vercel dev' to enable API functions.");
      return { success: false, error: "API Endpoint Unreachable (Local Dev)" };
    }

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

export const testMarketConnection = async (): Promise<boolean> => {
  try {
    // Lightweight test using a stable pair
    const result = await getMarketData('forex', 'EUR');
    // If we get a result object and it doesn't have a critical 'API Endpoint Unreachable' error
    if (result && result.error !== "API Endpoint Unreachable (Local Dev)") {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
