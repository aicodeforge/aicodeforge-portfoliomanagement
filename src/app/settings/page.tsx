"use client";

import { usePortfolioStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
	const { assets } = usePortfolioStore();
	const router = useRouter();

	const handleExport = () => {
		const dataStr = JSON.stringify(assets, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const importedAssets = JSON.parse(event.target?.result as string);

				if (confirm(`This will replace your current ${assets.length} assets with ${importedAssets.length} imported assets. Continue?`)) {
					// Clear existing and import new
					localStorage.setItem('portfolio-storage', JSON.stringify({
						state: { assets: importedAssets, lastUpdated: null },
						version: 0
					}));

					alert('Portfolio imported successfully! Refreshing...');
					window.location.reload();
				}
			} catch (error) {
				alert('Error importing file. Please make sure it\'s a valid portfolio backup.');
				console.error(error);
			}
		};
		reader.readAsText(file);
	};

	const handleClearData = () => {
		if (confirm('Are you sure you want to delete ALL your portfolio data? This cannot be undone!')) {
			if (confirm('Really delete everything? Please export a backup first if you haven\'t!')) {
				localStorage.removeItem('portfolio-storage');
				alert('All data cleared. Refreshing...');
				window.location.reload();
			}
		}
	};

	return (
		<div className="container">
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
				<Link href="/" style={{ color: 'var(--primary)', fontSize: '17px', marginRight: 'auto' }}>
					← Back
				</Link>
				<h1 style={{ fontSize: '17px', fontWeight: '600', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
					Settings
				</h1>
			</div>

			<div className="card">
				<h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Backup & Restore</h2>

				<div style={{ marginBottom: '24px' }}>
					<h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Export Portfolio</h3>
					<p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
						Download your portfolio data as a backup file. Save it to iCloud, Google Drive, or your computer.
					</p>
					<button onClick={handleExport} className="btn" style={{ width: '100%' }}>
						📥 Export Portfolio ({assets.length} assets)
					</button>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Import Portfolio</h3>
					<p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
						Restore your portfolio from a backup file. This will replace your current data.
					</p>
					<label className="btn" style={{ width: '100%', cursor: 'pointer' }}>
						📤 Import Portfolio
						<input
							type="file"
							accept=".json"
							onChange={handleImport}
							style={{ display: 'none' }}
						/>
					</label>
				</div>

				<div>
					<h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--danger)' }}>Danger Zone</h3>
					<p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
						Permanently delete all your portfolio data. This cannot be undone!
					</p>
					<button
						onClick={handleClearData}
						className="btn"
						style={{ width: '100%', backgroundColor: 'var(--danger)' }}
					>
						🗑️ Clear All Data
					</button>
				</div>
			</div>

			<div className="card">
				<h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>About</h2>
				<p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
					<strong>Portfolio Manager</strong><br />
					Your data is stored locally on your device for privacy and security.
					Use the export feature to create backups and transfer your portfolio to other devices.
				</p>
			</div>
		</div>
	);
}
