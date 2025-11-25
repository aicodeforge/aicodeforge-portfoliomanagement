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
	const [price, setPrice] = useState('');
	const [type, setType] = useState<AssetType>('stock');
	const [location, setLocation] = useState<AssetLocation>('us');
	const [isFetchingPrice, setIsFetchingPrice] = useState(false);

	useEffect(() => {
		if (id) {
			const asset = assets.find(a => a.id === id);
			if (asset) {
				setSymbol(asset.symbol);
				setQuantity(asset.quantity.toString());
				setPrice(asset.price.toString());
				setType(asset.type);
				setLocation(asset.location);
			}
		}
	}, [id, assets]);

	// Fetch price, type, and location when symbol changes
	useEffect(() => {
		const fetchSymbolData = async () => {
			if (!symbol || symbol.length < 1) {
				return;
			}

			// Only fetch if price is empty (don't overwrite manual entry if user is typing)
			// But if it's a new symbol entry (length changed significantly or just started), we might want to fetch
			// For now, let's fetch if price is empty or if we just typed the symbol

			setIsFetchingPrice(true);
			try {
				const res = await fetch(`/api/symbol-lookup?symbol=${symbol}`);
				const data = await res.json();

				if (data.price) {
					setPrice(data.price.toString());
				}

				// Auto-populate type and location if not editing an existing asset
				if (!id) {
					if (data.type) {
						setType(data.type);
					}
					if (data.location) {
						setLocation(data.location);
					}
				}
			} catch (error) {
				console.error('Failed to fetch symbol data', error);
			} finally {
				setIsFetchingPrice(false);
			}
		};

		const timeoutId = setTimeout(fetchSymbolData, 500); // Debounce
		return () => clearTimeout(timeoutId);
	}, [symbol, id]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!price) {
			alert('Please enter a price');
			return;
		}

		const assetData = {
			symbol: symbol.toUpperCase(),
			quantity: parseFloat(quantity),
			price: parseFloat(price),
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
				<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
					Current Price {isFetchingPrice && <span style={{ fontSize: '12px', fontWeight: 'normal' }}> (Fetching...)</span>}
				</label>
				<div style={{ position: 'relative' }}>
					<span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
					<input
						type="number"
						step="any"
						className="input"
						style={{ paddingLeft: '24px' }}
						placeholder="0.00"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						required
					/>
				</div>
				<div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
					Auto-fetched from API, but you can edit manually.
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
