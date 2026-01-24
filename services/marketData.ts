
/**
 * Market Data Service
 * Consumes the secure /api/market proxy to fetch data without exposing keys.
 */

export interface MarketDataResponse {
  success: boolean;
  rates?: Record<string, number>;
  quotes?: Record<string, number>;
  data?: any[];
  error?: string | any;
  timestamp?: number;
  date?: string;
}

export const getMarketData = async (type: 'forex' | 'stock', symbol: string): Promise<MarketDataResponse | null> => {
  try {
    const response = await fetch(`/api/market?type=${type}&symbol=${symbol}`);
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      const text = await response.text();
      return { 
        success: false, 
        error: `API Error: Expected JSON but received ${contentType || 'unknown'}. Response: ${text.substring(0, 100)}...` 
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || `HTTP Error ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Failed to fetch ${type} data for ${symbol}:`, error);
    return { success: false, error: error.message || "Network connection failed" };
  }
};

export const testMarketConnection = async (): Promise<boolean> => {
  try {
    // Lightweight test using a stable pair
    const result = await getMarketData('forex', 'EUR');
    if (result && result.success && !result.error) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
