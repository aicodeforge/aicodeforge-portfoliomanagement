import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  // Get API key from environment variable
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    console.error('FINNHUB_API_KEY is not set');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const symbols = symbolsParam.split(',').map(s => s.toUpperCase());

  try {
    const results = [];

    // Finnhub allows 60 requests/minute, so we can fetch faster
    // But we'll add a small delay to be safe (100ms between requests)
    for (const symbol of symbols) {
      try {
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

        // Fetch from Finnhub API
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const data = await res.json();

        // Finnhub returns: { c: currentPrice, h: high, l: low, o: open, pc: previousClose, t: timestamp }
        // We use 'c' (current price)
        if (data.c === 0 || data.c === null || data.c === undefined) {
          throw new Error('Invalid or missing price data');
        }

        results.push({
          symbol,
          price: data.c,
        });
      } catch (error: any) {
        console.error(`Error fetching ${symbol}:`, error);
        results.push({ symbol, price: null, error: error.message });
      }
    }

    return NextResponse.json({ prices: results });
  } catch (error: any) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
