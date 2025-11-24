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

// Start with an empty portfolio - users will add their own assets
const INITIAL_ASSETS: Asset[] = [];

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
