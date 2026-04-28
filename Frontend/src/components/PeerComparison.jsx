import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PeerComparison.module.css';

const API_BASE_URL = "http://localhost:5262/api";

const PeerComparison = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/aiinsights/peer-comparison/${userId}`);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching peer comparison data:', err);
        setError('Failed to load peer comparison data.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Analyzing global community data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const renderDifferenceBadge = (diff, isSavingsRate = false) => {
    const isPositive = diff > 0;
    // For savings rate, positive difference is good. For expenses, positive (more than average) is bad.
    const isGood = isSavingsRate ? isPositive : !isPositive;
    
    const formattedDiff = Math.abs(diff).toFixed(1);
    
    return (
      <span className={`${styles.badge} ${isGood ? styles.goodBadge : styles.badBadge}`}>
        {isPositive ? '↑' : '↓'} {formattedDiff}% vs Average
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Anonymous Benchmarking</h2>
        <p>See how your financial habits compare to the Money-Mates community.</p>
      </div>

      <div className={styles.cardsGrid}>
        {/* Total Spending Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                💸
              </div>
              <h3>Total Spending</h3>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statRow}>
              <span className={styles.label}>You</span>
              <span className={styles.value}>Rs. {data.totalSpending.userAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Community Avg</span>
              <span className={styles.value}>Rs. {data.totalSpending.averageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className={styles.cardFooter}>
            {renderDifferenceBadge(data.totalSpending.percentageDifference, false)}
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                💰
              </div>
              <h3>Savings Rate</h3>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statRow}>
              <span className={styles.label}>You</span>
              <span className={styles.value}>{data.savingsRate.userRate.toFixed(1)}%</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.label}>Community Avg</span>
              <span className={styles.value}>{data.savingsRate.averageRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className={styles.cardFooter}>
            {renderDifferenceBadge(data.savingsRate.percentageDifference, true)}
          </div>
        </div>

        {/* Top Categories Cards */}
        {data.topCategories.map((cat, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleGroup}>
                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                  📊
                </div>
                <h3>{cat.category}</h3>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statRow}>
                <span className={styles.label}>You</span>
                <span className={styles.value}>Rs. {cat.userAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Community Avg</span>
                <span className={styles.value}>Rs. {cat.averageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              {renderDifferenceBadge(cat.percentageDifference, false)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeerComparison;
