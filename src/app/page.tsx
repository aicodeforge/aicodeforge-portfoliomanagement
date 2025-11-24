"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";

export default function Home() {
  const { assets, updatePrices, getSummary } = usePortfolioStore();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const summary = getSummary();

  useEffect(() => {
    setIsClient(true);
    // Only fetch on initial load, not automatically
  }, []);

  const fetchPrices = async () => {
    if (assets.length === 0) return;

    setIsLoading(true);
    try {
      const symbols = assets.map(a => a.symbol).join(',');
      const res = await fetch(`/api/prices?symbols=${symbols}`);
      const data = await res.json();

      if (data.prices) {
        updatePrices(data.prices);
      }
    } catch (error) {
      console.error('Failed to fetch prices', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="title" style={{ marginBottom: 0 }}>Portfolio</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/analytics" style={{
            fontSize: '20px',
            color: 'var(--primary)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--card-background)',
            borderRadius: '50%',
            boxShadow: 'var(--shadow)'
          }}>
            📊
          </Link>
          <Link href="/settings" style={{
            fontSize: '20px',
            color: 'var(--primary)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--card-background)',
            borderRadius: '50%',
            boxShadow: 'var(--shadow)'
          }}>
            ⚙️
          </Link>
          <button
            onClick={fetchPrices}
            disabled={isLoading}
            style={{
              fontSize: '20px',
              color: 'var(--primary)',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--card-background)',
              borderRadius: '50%',
              boxShadow: 'var(--shadow)',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
          <Link href="/add" style={{
            fontSize: '24px',
            color: 'var(--primary)',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--card-background)',
            borderRadius: '50%',
            boxShadow: 'var(--shadow)'
          }}>
            +
          </Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="subtitle">Total Value</p>
            <h2 style={{ fontSize: '40px', fontWeight: '800', margin: '8px 0' }}>
              ${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          {isLoading && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Updating...</div>}
        </div>
      </div>

      <div className="card">
        <h3 className="subtitle" style={{ marginBottom: '12px' }}>Assets</h3>
        {summary.assets.map((asset) => {
          const assetValue = asset.quantity * asset.price;
          const percentage = (assetValue / summary.totalValue) * 100;

          return (
            <Link href={`/add?id=${asset.id}`} key={asset.id} className="list-item">
              <div>
                <div style={{ fontWeight: '600', fontSize: '17px' }}>{asset.symbol.toUpperCase()}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {asset.quantity.toLocaleString()} {asset.type}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', fontSize: '17px' }}>
                  ${assetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {percentage.toFixed(2)}% • ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
