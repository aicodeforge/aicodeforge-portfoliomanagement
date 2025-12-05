import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Helper function to determine asset type and location based on symbol
function classifySymbol(symbol: string, profileData?: any) {
	const upperSymbol = symbol.toUpperCase();

	// Crypto detection
	if (upperSymbol.includes('-USD') || upperSymbol.includes('BTC') || upperSymbol.includes('ETH')) {
		return { type: 'coin', location: 'no us' };
	}

	// Bond ETF detection (common bond ETF symbols)
	const bondETFs = ['BND', 'AGG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG', 'MUB', 'VCIT', 'VCSH', 'BSV', 'BIV', 'BLV', 'VBIAX'];
	if (bondETFs.includes(upperSymbol)) {
		return { type: 'bond', location: 'us' };
	}

	// International/Non-US ETF detection
	const internationalETFs = ['VXUS', 'VEA', 'VWO', 'IEMG', 'EFA', 'IXUS', 'ACWI', 'VTIAX'];
	if (internationalETFs.includes(upperSymbol)) {
		return { type: 'stock', location: 'no us' };
	}

	// Check if it's from profile data
	if (profileData) {
		const country = profileData.country || '';
		const isUS = country === 'US' || country === 'United States';
		return { type: 'stock', location: isUS ? 'us' : 'no us' };
	}

	// Default to US stock
	return { type: 'stock', location: 'us' };
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const symbol = searchParams.get('symbol');

	if (!symbol) {
		return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
	}

	const apiKey = process.env.FINNHUB_API_KEY;
	const upperSymbol = symbol.toUpperCase();

	let price = null;
	let profile = null;
	let classification = classifySymbol(upperSymbol);

	try {
		// 1. Try Finnhub first if API key is present
		if (apiKey) {
			try {
				const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${apiKey}`);

				if (quoteRes.ok) {
					const quoteData = await quoteRes.json();

					if (quoteData.c && quoteData.c > 0) {
						price = quoteData.c;

						// Try to get company profile for better classification
						try {
							const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${upperSymbol}&token=${apiKey}`);
							if (profileRes.ok) {
								profile = await profileRes.json();
								classification = classifySymbol(upperSymbol, profile);
							}
						} catch (error) {
							console.log('Could not fetch profile, using default classification');
						}
					}
				}
			} catch (finnhubError) {
				console.error('Finnhub fetch failed:', finnhubError);
			}
		}

		// 2. Fallback to Yahoo Finance if price is still null
		if (!price) {
			console.log(`Finnhub failed or returned no price for ${upperSymbol}, trying Yahoo Finance...`);
			try {
				// yahoo-finance2 v3 requires instantiation
				const yf = new yahooFinance();
				let result = null;

				try {
					result = await yf.quote(upperSymbol);
				} catch (quoteError) {
					console.log(`Quote failed for ${upperSymbol}, trying search...`);
				}

				// If quote failed or returned no price, try search
				if (!result || !result.regularMarketPrice) {
					try {
						const searchResult = await yf.search(upperSymbol);
						if (searchResult.quotes.length > 0) {
							const firstMatch = searchResult.quotes[0];
							console.log(`Found match for ${upperSymbol}: ${firstMatch.symbol}`);
							result = await yf.quote(firstMatch.symbol as string);
						}
					} catch (searchError) {
						console.error('Search failed:', searchError);
					}
				}

				if (result && result.regularMarketPrice) {
					price = result.regularMarketPrice;

					// Update symbol to the found one if it was a search result
					if (result.symbol !== upperSymbol) {
						// We might want to return the actual symbol found
						// But for now let's just use the price
					}

					// Refine classification based on Yahoo data
					if (result.currency === 'KRW' || (result.exchange && result.exchange.includes('KSC'))) {
						classification = { type: 'stock', location: 'no us' };
					} else if (result.quoteType === 'CRYPTOCURRENCY') {
						classification = { type: 'coin', location: 'no us' };
					} else if (result.quoteType === 'ETF') {
						// Check if it's international ETF
						// For now default to what we had or check currency
					}

					// Currency Conversion
					if (result.currency && result.currency !== 'USD') {
						try {
							// Construct exchange rate symbol (e.g., KRW=X for USD/KRW)
							// Yahoo usually uses CURRENCY=X for USD/CURRENCY pair (amount of CURRENCY per 1 USD)
							const exchangeSymbol = `${result.currency}=X`;
							const rateResult = await yf.quote(exchangeSymbol);

							if (rateResult && rateResult.regularMarketPrice) {
								const rate = rateResult.regularMarketPrice;
								console.log(`Converting ${price} ${result.currency} to USD using rate ${rate}`);
								price = price / rate;
							}
						} catch (rateError) {
							console.error(`Failed to fetch exchange rate for ${result.currency}:`, rateError);
						}
					}
				}
			} catch (yfError) {
				console.error('Yahoo Finance fetch failed:', yfError);
			}
		}

		return NextResponse.json({
			symbol: upperSymbol,
			price,
			type: classification.type,
			location: classification.location,
			profile: profile ? {
				name: profile.name,
				country: profile.country,
				exchange: profile.exchange,
			} : null,
		});
	} catch (error: any) {
		console.error(`Error looking up ${symbol}:`, error);

		// Even on error, return classification
		const classification = classifySymbol(upperSymbol);
		return NextResponse.json({
			symbol: upperSymbol,
			price: null,
			type: classification.type,
			location: classification.location,
			error: error.message,
		});
	}
}
