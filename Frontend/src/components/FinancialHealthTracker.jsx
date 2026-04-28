import React, { useEffect, useState } from 'react';
import { FaLeaf, FaChartLine, FaWallet } from 'react-icons/fa';
import styles from './FinancialHealthTracker.module.css';
import healthScoreService from '../services/healthScoreService';

const FinancialHealthTracker = ({ userId }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        const data = await healthScoreService.calculateFinancialHealth(userId);
        setHealthData(data);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('Failed to calculate financial health');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHealthData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.tracker}>
        <div className={styles.loadingContainer}>
          <p>Calculating your financial health...</p>
        </div>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className={styles.tracker}>
        <div className={styles.errorContainer}>
          <p>{error || 'Unable to calculate financial health'}</p>
        </div>
      </div>
    );
  }

  const { overallScore, status, metrics, summary } = healthData;

  return (
    <div className={styles.tracker}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Financial Health Tracker</h2>
        <p className={styles.month}>{summary.month}</p>
      </div>

      {/* Overall Score Section */}
      <div className={styles.overallSection}>
        <div className={styles.gaugeContainer}>
          <div className={styles.gauge}>
            <svg className={styles.gaugeSvg} viewBox="0 0 200 200">
              {/* Background circle */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" strokeWidth="15" />
              
              {/* Score arc */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={status.color}
                strokeWidth="15"
                strokeDasharray={`${(overallScore / 100) * 565.5} 565.5`}
                strokeLinecap="round"
                className={styles.scoreArc}
              />
            </svg>
            <div className={styles.scoreText}>
              <div className={styles.scoreNumber}>{overallScore}</div>
              <div className={styles.scoreLabel}>/ 100</div>
            </div>
          </div>

          <div className={styles.statusBox} style={{ borderColor: status.color }}>
            <div className={styles.statusIcon}>{status.icon}</div>
            <div className={styles.statusLabel}>{status.status}</div>
          </div>
        </div>

        <div className={styles.summaryBox}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Income</span>
            <span className={styles.summaryValue} style={{ color: '#27ae60' }}>
              Rs {summary.totalIncome?.toLocaleString()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Expenses</span>
            <span className={styles.summaryValue} style={{ color: '#e74c3c' }}>
              Rs {summary.totalExpenses?.toLocaleString()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Savings</span>
            <span
              className={styles.summaryValue}
              style={{
                color: summary.totalSavings >= 0 ? '#3498db' : '#e74c3c',
              }}
            >
              Rs {summary.totalSavings?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className={styles.metricsSection}>
        <h3 className={styles.metricsTitle}>Health Score Breakdown</h3>

        {/* Savings Ratio */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <FaLeaf />
            </div>
            <div className={styles.metricInfo}>
              <h4>Savings Ratio</h4>
              <p className={styles.metricWeight}>{metrics.savings.weight}% weight</p>
            </div>
            <div className={styles.metricScore} style={{ color: '#43e97b' }}>
              {metrics.savings.score}
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${metrics.savings.score}%`,
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
              }}
            />
          </div>
          <div className={styles.metricDetails}>
            <span>
              Savings: {metrics.savings.details.savingsPercentage.toFixed(1)}% of income
            </span>
          </div>
        </div>

        {/* Budget Adherence */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <FaChartLine />
            </div>
            <div className={styles.metricInfo}>
              <h4>Budget Adherence</h4>
              <p className={styles.metricWeight}>{metrics.budget.weight}% weight</p>
            </div>
            <div className={styles.metricScore} style={{ color: '#f39c12' }}>
              {metrics.budget.score}
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${metrics.budget.score}%`,
                background: 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
              }}
            />
          </div>
          <div className={styles.metricDetails}>
            <span>
              {metrics.budget.details.categoriesTracked} categories tracked
            </span>
          </div>
        </div>

        {/* Expense Ratio */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
              <FaWallet />
            </div>
            <div className={styles.metricInfo}>
              <h4>Expense Ratio</h4>
              <p className={styles.metricWeight}>{metrics.expense.weight}% weight</p>
            </div>
            <div className={styles.metricScore} style={{ color: '#3498db' }}>
              {metrics.expense.score}
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{
                width: `${metrics.expense.score}%`,
                background: 'linear-gradient(90deg, #30cfd0 0%, #330867 100%)',
              }}
            />
          </div>
          <div className={styles.metricDetails}>
            <span>
              Spending: {metrics.expense.details.expensePercentage.toFixed(1)}% of income
            </span>
          </div>
        </div>
      </div>


    </div>
  );
};

export default FinancialHealthTracker;
