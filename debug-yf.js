const yf = require('yahoo-finance2');
console.log('Default export:', yf);
console.log('Keys:', Object.keys(yf));
console.log('Is default a class?', yf.toString().startsWith('class'));
try {
	const instance = new yf();
	console.log('Successfully instantiated default export');
} catch (e) {
	console.log('Default export is not a constructor');
}

if (yf.YahooFinance) {
	console.log('yf.YahooFinance exists');
	try {
		const instance = new yf.YahooFinance();
		console.log('Successfully instantiated yf.YahooFinance');
	} catch (e) {
		console.log('yf.YahooFinance is not a constructor');
	}
}
