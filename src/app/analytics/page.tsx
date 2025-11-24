"use client";

import { usePortfolioStore } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function AnalyticsPage() {
	const { getSummary } = usePortfolioStore();
	const summary = getSummary();

	// Group by type
	const byType = summary.assets.reduce((acc, asset) => {
		const value = asset.quantity * asset.price;
		acc[asset.type] = (acc[asset.type] || 0) + value;
		return acc;
	}, {} as Record<string, number>);

	// Group by location
	const byLocation = summary.assets.reduce((acc, asset) => {
		const value = asset.quantity * asset.price;
		acc[asset.location] = (acc[asset.location] || 0) + value;
		return acc;
	}, {} as Record<string, number>);

	// Top 5 holdings
	const top5 = summary.assets.slice(0, 5);

	return (
		<div className="container">
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
				<Link href="/" style={{ color: 'var(--primary)', fontSize: '17px', marginRight: 'auto' }}>
					← Back
				</Link>
				<h1 style={{ fontSize: '17px', fontWeight: '600', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
					Analytics
				</h1>
			</div>

			{/* Total Value */}
			<div className="card">
				<p className="subtitle">Total Portfolio Value</p>
				<h2 style={{ fontSize: '40px', fontWeight: '800', margin: '8px 0' }}>
					${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</h2>
				<p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
					{summary.assets.length} assets
				</p>
			</div>

			{/* By Asset Type */}
			<div className="card">
				<h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>By Asset Type</h3>
				{Object.entries(byType).map(([type, value]) => {
					const percentage = (value / summary.totalValue) * 100;
					return (
						<div key={type} style={{ marginBottom: '16px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
								<span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{type}</span>
								<span style={{ fontWeight: '600' }}>
									${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
							</div>
							<div style={{
								width: '100%',
								height: '8px',
								backgroundColor: 'var(--separator)',
								borderRadius: '4px',
								overflow: 'hidden'
							}}>
								<div style={{
									width: `${percentage}%`,
									height: '100%',
									backgroundColor: type === 'stock' ? 'var(--primary)' : type === 'bond' ? 'var(--secondary)' : 'var(--warning)',
									transition: 'width 0.3s ease'
								}}></div>
							</div>
							<div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
								{percentage.toFixed(2)}%
							</div>
						</div>
					);
				})}
			</div>

			{/* By Location */}
			<div className="card">
				<h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>By Location</h3>
				{Object.entries(byLocation).map(([location, value]) => {
					const percentage = (value / summary.totalValue) * 100;
					return (
						<div key={location} style={{ marginBottom: '16px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
								<span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{location}</span>
								<span style={{ fontWeight: '600' }}>
									${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
							</div>
							<div style={{
								width: '100%',
								height: '8px',
								backgroundColor: 'var(--separator)',
								borderRadius: '4px',
								overflow: 'hidden'
							}}>
								<div style={{
									width: `${percentage}%`,
									height: '100%',
									backgroundColor: location === 'us' ? 'var(--success)' : 'var(--warning)',
									transition: 'width 0.3s ease'
								}}></div>
							</div>
							<div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
								{percentage.toFixed(2)}%
							</div>
						</div>
					);
				})}
			</div>

			{/* Top 5 Holdings */}
			<div className="card">
				<h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Top 5 Holdings</h3>
				{top5.map((asset, index) => {
					const value = asset.quantity * asset.price;
					const percentage = (value / summary.totalValue) * 100;
					return (
						<div key={asset.id} className="list-item">
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<div style={{
									width: '32px',
									height: '32px',
									borderRadius: '50%',
									backgroundColor: 'var(--primary)',
									color: 'white',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: '700',
									fontSize: '14px'
								}}>
									{index + 1}
								</div>
								<div>
									<div style={{ fontWeight: '600', fontSize: '17px' }}>{asset.symbol.toUpperCase()}</div>
									<div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
										{asset.quantity.toLocaleString()} {asset.type}
									</div>
								</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<div style={{ fontWeight: '600', fontSize: '17px' }}>
									${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</div>
								<div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
									{percentage.toFixed(2)}%
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
