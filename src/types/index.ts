export type AssetType = 'stock' | 'bond' | 'coin';
export type AssetLocation = 'us' | 'no us';

export interface Asset {
	id: string;
	symbol: string; // e.g., VOO, NVDA
	quantity: number;
	price: number; // Current price per unit
	type: AssetType;
	location: AssetLocation;
}

export interface PortfolioSummary {
	totalValue: number;
	assets: Asset[];
}
