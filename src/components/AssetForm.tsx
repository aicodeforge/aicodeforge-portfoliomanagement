"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AssetType, AssetLocation } from '@/types';
import { usePortfolioStore } from '@/lib/store';

export default function AssetForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get('id');

	const { assets, addAsset, updateAsset, removeAsset } = usePortfolioStore();

	const [symbol, setSymbol] = useState('');
	const [quantity, setQuantity] = useState('');
	const [price, setPrice] = useState<number | null>(null);
	const [type, setType] = useState<AssetType>('stock');
	const [location, setLocation] = useState<AssetLocation>('us');
	const [isFetchingPrice, setIsFetchingPrice] = useState(false);

	useEffect(() => {
		if (id) {
			const asset = assets.find(a => a.id === id);
			if (asset) {
				setSymbol(asset.symbol);
				setQuantity(asset.quantity.toString());
				setPrice(asset.price);
				setType(asset.type);
				setLocation(asset.location);
			}
		}
	}, [id, assets]);

	// Fetch price when symbol changes
	useEffect(() => {
		const fetchPrice = async () => {
			if (!symbol || symbol.length < 1) {
				setPrice(null);
				return;
			}

			setIsFetchingPrice(true);
			try {
				const res = await fetch(`/api/prices?symbols=${symbol}`);
				const data = await res.json();
				if (data.prices && data.prices[0] && data.prices[0].price) {
					setPrice(data.prices[0].price);
				} else {
					setPrice(null);
				}
			} catch (error) {
				console.error('Failed to fetch price', error);
				setPrice(null);
			} finally {
				setIsFetchingPrice(false);
			}
		};

		const timeoutId = setTimeout(fetchPrice, 500); // Debounce
		return () => clearTimeout(timeoutId);
	}, [symbol]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!price) {
			alert('Please wait for the price to load or enter a valid symbol');
			return;
		}

		const assetData = {
			symbol,
			quantity: parseFloat(quantity),
			price,
			type,
			location,
		};

		if (id) {
			updateAsset(id, assetData);
		} else {
			addAsset({
				id: crypto.randomUUID(),
				...assetData,
			});
		}

		router.back();
	};

	const handleDelete = () => {
		if (id && confirm('Are you sure you want to delete this asset?')) {
			removeAsset(id);
			router.back();
		}
	};

	return (
		<form onSubmit={handleSubmit} className="card">
			<div style={{ marginBottom: '16px' }}>
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Symbol</label>
				<input
					type="text"
					className="input"
					placeholder="e.g. VOO"
					value={symbol}
					onChange={(e) => setSymbol(e.target.value)}
					required
				/>
			</div>

			<div style={{ marginBottom: '16px' }}>
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Quantity</label>
				<input
					type="number"
					step="any"
					className="input"
					placeholder="0.00"
					value={quantity}
					onChange={(e) => setQuantity(e.target.value)}
					required
				/>
			</div>

			<div style={{ marginBottom: '16px' }}>
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Current Price</label>
				<div className="input" style={{
					backgroundColor: 'var(--background)',
					color: price ? 'var(--text-primary)' : 'var(--text-secondary)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					{isFetchingPrice ? 'Loading...' : price ? `$${price.toFixed(2)}` : 'Enter symbol to fetch price'}
					{isFetchingPrice && <span style={{ fontSize: '12px' }}>⏳</span>}
				</div>
			</div>

			<div style={{ marginBottom: '16px' }}>
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type</label>
				<select
					className="input"
					value={type}
					onChange={(e) => setType(e.target.value as AssetType)}
				>
					<option value="stock">Stock</option>
					<option value="bond">Bond</option>
					<option value="coin">Coin</option>
				</select>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Location</label>
				<select
					className="input"
					value={location}
					onChange={(e) => setLocation(e.target.value as AssetLocation)}
				>
					<option value="us">US</option>
					<option value="no us">Non-US</option>
				</select>
			</div>

			<button type="submit" className="btn" style={{ width: '100%', marginBottom: id ? '16px' : '0' }}>
				{id ? 'Update Asset' : 'Save Asset'}
			</button>

			{id && (
				<button
					type="button"
					onClick={handleDelete}
					className="btn"
					style={{ width: '100%', backgroundColor: 'var(--danger)' }}
				>
					Delete Asset
				</button>
			)}
		</form>
	);
}
