import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const symbolsParam = searchParams.get('symbols');

	if (!symbolsParam) {
		return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
	}

	const symbols = symbolsParam.split(',').map(s => s.toUpperCase());
	const results: Record<string, any[]> = {};

	try {
		// yahoo-finance2 v3 requires instantiation
		const yf = new yahooFinance();

		for (const symbol of symbols) {
			try {
				// Fetch top holdings for the ETF
				const quoteSummary = await yf.quoteSummary(symbol, {
					modules: ['topHoldings']
				});

				if (quoteSummary.topHoldings && quoteSummary.topHoldings.holdings) {
					results[symbol] = quoteSummary.topHoldings.holdings.map((holding: any) => ({
						symbol: holding.symbol,
						name: holding.holdingName,
						percent: holding.holdingPercent // This is usually a decimal (e.g., 0.07 for 7%)
					}));
				} else {
					results[symbol] = [];
				}
			} catch (error) {
				console.error(`Error fetching holdings for ${symbol}:`, error);
				results[symbol] = [];
			}
		}

		return NextResponse.json({ holdings: results });
	} catch (error: any) {
		console.error('Error fetching ETF holdings:', error);
		return NextResponse.json({ error: 'Failed to fetch ETF holdings' }, { status: 500 });
	}
}
