import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.toUpperCase());

  try {
    const results = [];
    for (const symbol of symbols) {
      try {
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch directly from Yahoo Finance API
        // Note: This is an unofficial endpoint and might be rate limited or changed.
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result || !result.meta) {
          throw new Error('Invalid data format');
        }

        const price = result.meta.regularMarketPrice;

        results.push({
          symbol,
          price,
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
