"use client";

import { useState, useEffect } from 'react';
import { usePortfolioStore } from '@/lib/store';
import { Asset } from '@/types';

interface Holding {
	symbol: string;
	name: string;
	percent: number;
}

interface StockExposure {
	symbol: string;
	name: string;
	value: number;
	sources: {
		sourceSymbol: string; // 'Direct' or ETF symbol
		value: number;
	}[];
}

export default function ActualHoldings() {
	const { assets } = usePortfolioStore();
	const [etfHoldings, setEtfHoldings] = useState<Record<string, Holding[]>>({});
	const [loading, setLoading] = useState(false);
	const [calculatedHoldings, setCalculatedHoldings] = useState<StockExposure[]>([]);

	useEffect(() => {
		const fetchEtfHoldings = async () => {
			// Filter for potential ETFs (stocks and bonds)
			// We'll just check everything that isn't a coin, or maybe just check all.
			// Optimally, we only check things that look like ETFs or just check all 'stock'/'bond'
			const potentialEtfs = assets.filter(a => a.type === 'stock' || a.type === 'bond').map(a => a.symbol);

			if (potentialEtfs.length === 0) return;

			setLoading(true);
			try {
				// Chunk requests if too many symbols? For now, send all.
				const symbolsParam = potentialEtfs.join(',');
				const res = await fetch(`/api/etf-holdings?symbols=${symbolsParam}`);
				const data = await res.json();

				if (data.holdings) {
					setEtfHoldings(data.holdings);
				}
			} catch (error) {
				console.error('Failed to fetch ETF holdings', error);
			} finally {
				setLoading(false);
			}
		};

		fetchEtfHoldings();
	}, [assets]);

	useEffect(() => {
		if (Object.keys(etfHoldings).length === 0 && !loading && assets.length > 0) {
			// If we have assets but no ETF data yet (or failed), we can still calculate direct holdings
			// But let's wait for loading to finish
		}

		const exposureMap = new Map<string, StockExposure>();

		// Helper to add value to exposure map
		const addExposure = (symbol: string, name: string, value: number, source: string) => {
			const normalizedSymbol = symbol.toUpperCase();
			const existing = exposureMap.get(normalizedSymbol);

			if (existing) {
				existing.value += value;
				existing.sources.push({ sourceSymbol: source, value });
			} else {
				exposureMap.set(normalizedSymbol, {
					symbol: normalizedSymbol,
					name: name || normalizedSymbol,
					value,
					sources: [{ sourceSymbol: source, value }]
				});
			}
		};

		assets.forEach(asset => {
			const assetValue = asset.quantity * asset.price;
			const holdings = etfHoldings[asset.symbol.toUpperCase()];

			if (holdings && holdings.length > 0) {
				// It's an ETF with known holdings
				// 1. Add the "Look-through" holdings
				let holdingsValue = 0;
				holdings.forEach(holding => {
					const holdingValue = assetValue * holding.percent;
					addExposure(holding.symbol, holding.name, holdingValue, asset.symbol);
					holdingsValue += holdingValue;
				});

				// 2. The remaining value is attributed to the ETF itself (or other unknown holdings)
				// For simplicity, we might just ignore the remainder or list it as "Other in [ETF]"
				// But the user wants "Actual Top 5 Holdings", usually implying underlying stocks.
				// Let's NOT add the ETF itself to the list if we have its holdings, 
				// OR we add the remainder? 
				// Usually, for "Top Stock Exposure", we care about the underlying.
				// But if we only have Top 10 holdings, we are missing ~60-70% of the ETF value.
				// This is a known limitation.

			} else {
				// It's a direct holding (or an ETF with no data)
				addExposure(asset.symbol, asset.symbol, assetValue, 'Direct');
			}
		});

		// Convert map to array and sort
		const sorted = Array.from(exposureMap.values())
			.sort((a, b) => b.value - a.value)
			.slice(0, 10); // Top 10

		setCalculatedHoldings(sorted);

	}, [assets, etfHoldings, loading]);

	if (assets.length === 0) return null;

	const totalPortfolioValue = assets.reduce((sum, a) => sum + (a.quantity * a.price), 0);

	return (
		<div className="card" style={{ marginTop: '24px' }}>
			<h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
				Actual Top Holdings (Look-through)
			</h2>

			{loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analyzing ETF composition...</p>}

			{!loading && calculatedHoldings.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{calculatedHoldings.map((item) => {
						const percent = (item.value / totalPortfolioValue) * 100;
						return (
							<div key={item.symbol} style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '8px 0',
								borderBottom: '1px solid var(--border)'
							}}>
								<div style={{ flex: 1 }}>
									<div style={{ fontWeight: '600' }}>{item.symbol}</div>
									<div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
										{item.name}
									</div>
									{/* Show sources if mixed */}
									{item.sources.length > 1 && (
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
											Via: {item.sources.map(s => `${s.sourceSymbol} (${((s.value / item.value) * 100).toFixed(0)}%)`).join(', ')}
										</div>
									)}
									{item.sources.length === 1 && item.sources[0].sourceSymbol !== 'Direct' && (
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
											Via: {item.sources[0].sourceSymbol}
										</div>
									)}
								</div>

								<div style={{ textAlign: 'right' }}>
									<div style={{ fontWeight: '600' }}>${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
									<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
										{percent.toFixed(2)}%
									</div>
								</div>
							</div>
						);
					})}

					<div style={{
						fontSize: '0.8rem',
						color: 'var(--text-secondary)',
						marginTop: '12px',
						fontStyle: 'italic',
						backgroundColor: 'var(--background)',
						padding: '8px',
						borderRadius: '8px'
					}}>
						Note: ETF look-through is based on Top 10 holdings only. Actual exposure may be higher.
					</div>
				</div>
			)}
		</div>
	);
}
