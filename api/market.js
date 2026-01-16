
export default async function handler(req, res) {
  const { type, symbol } = req.query;

  if (!type || !symbol) {
    return res.status(400).json({ error: "Missing type or symbol parameters" });
  }

  try {
    if (type === 'forex') {
      // APILayer (Fixer/Currency Data)
      // Documentation: https://apilayer.com/marketplace/fixer-api
      // Using /fixer/latest to get rates relative to USD (Base)
      const headers = new Headers();
      headers.append("apikey", process.env.Currency_api);

      const requestOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
      };

      // Assuming symbol is the target currency (e.g., EUR, GBP)
      const url = `https://api.apilayer.com/fixer/latest?base=USD&symbols=${symbol}`;
      
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      return res.status(200).json(data);
    } 
    
    if (type === 'stock') {
      // Marketstack (Stocks)
      // Documentation: https://marketstack.com/documentation
      // Using /eod (End of Day) or /intraday
      
      // Note: Free tier might not support HTTPS, but Vercel fetches happen server-side
      const url = `http://api.marketstack.com/v2/eod?access_key=${process.env.Stockmarket_api}&symbols=${symbol}&limit=1`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid market type specified. Use 'forex' or 'stock'." });

  } catch (error) {
    console.error("Market Proxy Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch market data", 
      details: error.message 
    });
  }
}
