
import yahooFinance from 'yahoo-finance2';

async function test() {
	const yf = new yahooFinance();
	try {
		const symbols = ['005930.KS', '000660.KS'];
		for (const symbol of symbols) {
			console.log(`Fetching ${symbol}...`);
			try {
				const result = await yf.quote(symbol);
				console.log(`Success for ${symbol}:`, result.symbol, result.regularMarketPrice, result.currency);
			} catch (e: any) {
				console.log(`Failed for ${symbol}:`, e.message);
			}
		}

		const queries = ['Samsung', 'SK Hynix', '005930'];
		for (const query of queries) {
			console.log(`Searching for ${query}...`);
			try {
				const result = await yf.search(query);
				if (result.quotes.length > 0) {
					const first = result.quotes[0];
					console.log(`Found for ${query}:`, first.symbol, first.shortname, first.exchange);
				} else {
					console.log(`No results for ${query}`);
				}
			} catch (e: any) {
				console.log(`Search failed for ${query}:`, e.message);
			}
		}

		const currencies = ['KRW=X', 'USDKRW=X'];
		for (const curr of currencies) {
			console.log(`Fetching rate for ${curr}...`);
			try {
				const result = await yf.quote(curr);
				console.log(`Rate for ${curr}:`, result.regularMarketPrice);
			} catch (e: any) {
				console.log(`Failed for ${curr}:`, e.message);
			}
		}
	} catch (e) {
		console.error(e);
	}
}

test();
