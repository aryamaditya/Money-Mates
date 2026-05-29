import React from 'react';
import './SkeletonLoader.css';

/**
 * Skeleton Loader Components
 * Provides loading placeholders for different content types
 */

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line" style={{ width: '80%' }}></div>
  </div>
);

export const SkeletonChart = () => (
  <div className="skeleton-chart">
    <div className="skeleton-line skeleton-title" style={{ marginBottom: '20px' }}></div>
    <div style={{ height: '200px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite' }}></div>
  </div>
);

export const SkeletonStats = () => (
  <div className="skeleton-stats">
    <div className="skeleton-stat-item">
      <div className="skeleton-avatar"></div>
      <div style={{ flex: 1 }}>
        <div className="skeleton-line" style={{ width: '60%', marginBottom: '8px' }}></div>
        <div className="skeleton-line" style={{ width: '80%' }}></div>
      </div>
    </div>
  </div>
);

export const SkeletonTransaction = () => (
  <div className="skeleton-transaction">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="skeleton-tx-item">
        <div className="skeleton-line" style={{ width: '40%' }}></div>
        <div className="skeleton-line" style={{ width: '30%', marginLeft: 'auto' }}></div>
      </div>
    ))}
  </div>
);
