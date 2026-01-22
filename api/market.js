
export default async function handler(req, res) {
  const { type, symbol } = req.query;

  if (!type || !symbol) {
    return res.status(400).json({ error: "Missing type or symbol parameters" });
  }

  try {
    if (type === 'forex') {
      // APILayer (Fixer/Currency Data)
      const url = `https://api.apilayer.com/fixer/latest?base=USD&symbols=${symbol}`;
      
      // Use plain object for headers for maximum Node.js compatibility
      const requestOptions = {
        method: 'GET',
        headers: {
          "apikey": process.env.Currency_api
        },
        redirect: 'follow'
      };
      
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      // Pass through APILayer error if success is false
      if (data.success === false) {
         console.error("APILayer Error:", data.error);
         return res.status(200).json({ error: data.error });
      }

      return res.status(200).json(data);
    } 
    
    if (type === 'stock') {
      // Marketstack (Stocks)
      // Note: Marketstack free tier is HTTP only
      const url = `http://api.marketstack.com/v2/eod?access_key=${process.env.Stockmarket_api}&symbols=${symbol}&limit=1`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("Marketstack Error:", data.error);
        return res.status(200).json({ error: data.error });
      }
      
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
