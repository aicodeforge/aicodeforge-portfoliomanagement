"use client";

import { usePortfolioStore } from '@/lib/store';
import { useState } from 'react';

export default function AiAdviceButton() {
	const { getSummary } = usePortfolioStore();
	const [copied, setCopied] = useState(false);

	const generatePrompt = () => {
		const summary = getSummary();
		const { assets, totalValue } = summary;

		// Group by type
		const byType = assets.reduce((acc, asset) => {
			const value = asset.quantity * asset.price;
			acc[asset.type] = (acc[asset.type] || 0) + value;
			return acc;
		}, {} as Record<string, number>);

		// Group by location
		const byLocation = assets.reduce((acc, asset) => {
			const value = asset.quantity * asset.price;
			acc[asset.location] = (acc[asset.location] || 0) + value;
			return acc;
		}, {} as Record<string, number>);

		let prompt = `I need your advice on my investment portfolio. Here is my current portfolio data:\n\n`;

		prompt += `**Total Value:** $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n`;

		prompt += `**Asset Allocation:**\n`;
		Object.entries(byType).forEach(([type, value]) => {
			const percent = (value / totalValue) * 100;
			prompt += `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${percent.toFixed(2)}% ($${value.toLocaleString('en-US', { minimumFractionDigits: 0 })})\n`;
		});
		prompt += `\n`;

		prompt += `**Geographic Allocation:**\n`;
		Object.entries(byLocation).forEach(([loc, value]) => {
			const percent = (value / totalValue) * 100;
			prompt += `- ${loc.toUpperCase()}: ${percent.toFixed(2)}% ($${value.toLocaleString('en-US', { minimumFractionDigits: 0 })})\n`;
		});
		prompt += `\n`;

		prompt += `**Holdings:**\n`;
		prompt += `| Symbol | Type | Location | Quantity | Price | Total Value | % of Portfolio |\n`;
		prompt += `|---|---|---|---|---|---|---|\n`;

		assets.sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price)).forEach(asset => {
			const value = asset.quantity * asset.price;
			const percent = (value / totalValue) * 100;
			prompt += `| ${asset.symbol.toUpperCase()} | ${asset.type} | ${asset.location} | ${asset.quantity.toLocaleString()} | $${asset.price.toFixed(2)} | $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} | ${percent.toFixed(2)}% |\n`;
		});

		prompt += `\n**My Goal:** I want to maximize returns while managing risk appropriate for a long-term investor. \n\n`;
		prompt += `**Please provide:**\n`;
		prompt += `1. An analysis of my current asset allocation and diversification.\n`;
		prompt += `2. Identification of any major risks or concentration issues (e.g., too much in one sector or stock).\n`;
		prompt += `3. Specific recommendations on how to improve my portfolio (what to buy, sell, or hold).\n`;
		prompt += `4. Suggestions for rebalancing if necessary.\n`;

		return prompt;
	};

	const handleCopy = async () => {
		const prompt = generatePrompt();
		try {
			await navigator.clipboard.writeText(prompt);
			setCopied(true);
			setTimeout(() => setCopied(false), 3000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
			alert('Failed to copy prompt. Please try again.');
		}
	};

	return (
		<div style={{ marginBottom: '20px', textAlign: 'center' }}>
			<button
				onClick={handleCopy}
				className="btn"
				style={{
					background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
					border: 'none',
					padding: '12px 24px',
					fontSize: '16px',
					fontWeight: '600',
					boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
					display: 'inline-flex',
					alignItems: 'center',
					gap: '8px'
				}}
			>
				<span>✨</span>
				{copied ? 'Copied to Clipboard!' : 'Get AI Advice'}
			</button>
			{copied && (
				<div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success)' }}>
					Prompt copied! Paste it into Gemini or ChatGPT.
				</div>
			)}
		</div>
	);
}
