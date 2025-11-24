import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, PortfolioSummary } from '@/types';

interface PortfolioState {
	assets: Asset[];
	lastUpdated: number | null;
	addAsset: (asset: Asset) => void;
	updateAsset: (id: string, updates: Partial<Asset>) => void;
	removeAsset: (id: string) => void;
	updatePrices: (prices: { symbol: string; price: number }[]) => void;
	getSummary: () => PortfolioSummary;
}

// Initial mock data to start with if storage is empty
const INITIAL_ASSETS: Asset[] = [
	{ id: '1', symbol: 'voo', quantity: 479.65269, price: 605.93, type: 'stock', location: 'us' },
	{ id: '2', symbol: 'nvda', quantity: 753.1816, price: 178.88, type: 'stock', location: 'us' },
	{ id: '3', symbol: 'tsla', quantity: 222.238733, price: 391.09, type: 'stock', location: 'us' },
	{ id: '4', symbol: 'meta', quantity: 101.60428, price: 594.25, type: 'stock', location: 'us' },
	{ id: '5', symbol: 'bnd', quantity: 1118.71364, price: 74.52, type: 'bond', location: 'us' },
	{ id: '6', symbol: 'GOOG', quantity: 189.95, price: 299.65, type: 'stock', location: 'us' },
	{ id: '7', symbol: 'msft', quantity: 100, price: 472.12, type: 'stock', location: 'us' },
	{ id: '8', symbol: 'FXAIX', quantity: 165.458, price: 229.71, type: 'stock', location: 'us' },
	{ id: '9', symbol: 'amd', quantity: 151.9, price: 203.78, type: 'stock', location: 'us' },
	{ id: '10', symbol: 'vxus', quantity: 307.97709, price: 72.92, type: 'stock', location: 'no us' },
	{ id: '11', symbol: 'vbiax', quantity: 307.354, price: 52.17, type: 'stock', location: 'us' },
	{ id: '12', symbol: 'oklo', quantity: 32, price: 88.17, type: 'stock', location: 'us' },
	{ id: '13', symbol: 'avgo', quantity: 7, price: 340.2, type: 'stock', location: 'us' },
	{ id: '14', symbol: 'bsv', quantity: 25.36, price: 79.04, type: 'bond', location: 'us' },
	{ id: '15', symbol: 'crcl', quantity: 29, price: 71.33, type: 'stock', location: 'us' },
	{ id: '16', symbol: 'tem', quantity: 3, price: 70.29, type: 'stock', location: 'us' },
	{ id: '17', symbol: 'btc-usd', quantity: 0.12025789, price: 84654.23, type: 'coin', location: 'no us' },
];

export const usePortfolioStore = create<PortfolioState>()(
	persist(
		(set, get) => ({
			assets: INITIAL_ASSETS,
			lastUpdated: null,

			addAsset: (asset) =>
				set((state) => ({ assets: [...state.assets, asset] })),

			updateAsset: (id, updates) =>
				set((state) => ({
					assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
				})),

			removeAsset: (id) =>
				set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

			updatePrices: (prices) =>
				set((state) => {
					const newAssets = state.assets.map((asset) => {
						const update = prices.find((p) => p.symbol.toLowerCase() === asset.symbol.toLowerCase());
						if (update && update.price) {
							return { ...asset, price: update.price };
						}
						return asset;
					});
					return { assets: newAssets, lastUpdated: Date.now() };
				}),

			getSummary: () => {
				const { assets } = get();
				const totalValue = assets.reduce((sum, asset) => sum + asset.quantity * asset.price, 0);
				const sortedAssets = [...assets].sort(
					(a, b) => b.quantity * b.price - a.quantity * a.price
				);
				return { totalValue, assets: sortedAssets };
			},
		}),
		{
			name: 'portfolio-storage',
		}
	)
);
