import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import styles from './PeerComparison.module.css';

const API_BASE_URL = "http://localhost:5262/api";

// Metric information - moved outside component to prevent recreation
const METRIC_INFO = {
  totalSpending: {
    title: 'Total Spending',
    description: 'The total amount of money you spent compared to your peers.',
    howCalculated: 'Sum of all your expenses in the current period',
    whatItMeans: 'Lower spending is generally better, but it depends on your income. The percentile shows how you rank among peers.',
    benchmark: 'If you\'re in the top 50%, you\'re spending less than half your peers.'
  },
  savingsRate: {
    title: 'Savings Rate',
    description: 'The percentage of your income that you save after spending.',
    howCalculated: '(Income - Spending) / Income × 100',
    whatItMeans: 'Higher savings rate is better. It shows your financial discipline and ability to build wealth.',
    benchmark: 'A 30% savings rate is excellent. Aim for at least 10-20% to build financial security.'
  },
  discretionary: {
    title: 'Discretionary Spending',
    description: 'Non-essential spending (shopping, entertainment, dining out) as a percentage of your budget.',
    howCalculated: 'Sum of non-essential expenses / Total income × 100. Essentials: Food, Housing, Utilities, Healthcare, Transport',
    whatItMeans: 'Lower discretionary spending means you prioritize essentials. Very high spending may indicate room for savings.',
    benchmark: 'Aim for 20-30% of budget on discretionary items. Below 20% is excellent.'
  },
  trend: {
    title: 'Savings Trend',
    description: 'Month-over-month change in your savings rate.',
    howCalculated: 'Current month savings rate - Previous month savings rate',
    whatItMeans: 'Positive trend means your financial habits are improving. Negative means you\'re spending more than before.',
    benchmark: 'Aim for a positive trend each month. Even +1% improvement shows progress!'
  }
};

// Memoized Info Modal Component
const InfoModal = memo(({ metric, onClose }) => {
  if (!metric) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h2>{metric.title}</h2>
        
        <div className={styles.infoSection}>
          <h4>What is it?</h4>
          <p>{metric.description}</p>
        </div>

        <div className={styles.infoSection}>
          <h4>How is it calculated?</h4>
          <p>{metric.howCalculated}</p>
        </div>

        <div className={styles.infoSection}>
          <h4>What does it mean?</h4>
          <p>{metric.whatItMeans}</p>
        </div>

        <div className={styles.infoSection}>
          <h4>Benchmark</h4>
          <p>{metric.benchmark}</p>
        </div>
      </div>
    </div>
  );
});

InfoModal.displayName = 'InfoModal';

// Memoized Info Icon Component
const InfoIcon = memo(({ metricKey, onShowInfo }) => (
  <button
    className={styles.infoIcon}
    onClick={() => onShowInfo(METRIC_INFO[metricKey])}
    title="Click for more information"
    aria-label="Information"
  >
    ℹ️
  </button>
));

InfoIcon.displayName = 'InfoIcon';

const PeerComparison = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSpending: { loaded: false, data: null, loading: true },
    savingsRate: { loaded: false, data: null, loading: true },
    discretionary: { loaded: false, data: null, loading: true },
    trend: { loaded: false, data: null, loading: true }
  });
  const [peerGroupSize, setPeerGroupSize] = useState(0);
  const [hasEnoughPeers, setHasEnoughPeers] = useState(true);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        // Fetch all metrics in parallel, but render them as they complete
        const response = await axios.get(`${API_BASE_URL}/aiinsights/peer-comparison/${userId}`);
        
        if (!response.data.hasEnoughPeers) {
          setHasEnoughPeers(false);
          setData(response.data);
          setLoading(false);
          return;
        }

        setHasEnoughPeers(true);
        setPeerGroupSize(response.data.peerGroupSize);

        // Update each metric as we receive it
        setMetrics(prev => ({
          ...prev,
          totalSpending: { loaded: true, data: response.data.totalSpending, loading: false },
          savingsRate: { loaded: true, data: response.data.savingsRate, loading: false },
          discretionary: { loaded: true, data: response.data.discretionary, loading: false },
          trend: { loaded: true, data: response.data.trend, loading: false }
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching peer comparison data:', err);
        setError('Failed to load peer comparison data.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchAllMetrics();
    }
  }, [userId]);

  const handleShowInfo = useCallback((metric) => {
    setSelectedMetric(metric);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedMetric(null);
  }, []);

  const getPercentileBadge = useCallback((percentile, isGoodHigh = true) => {
    const isGoodRank = isGoodHigh ? percentile >= 50 : percentile < 50;
    
    return (
      <div className={`${styles.rankingBadge} ${isGoodRank ? styles.goodRank : styles.needsWork}`}>
        <span className={styles.rankIcon}>{isGoodRank ? '⭐' : '📈'}</span>
        <span>Top {percentile}%</span>
      </div>
    );
  }, []);

  const getTrendBadge = useCallback((userTrend, avgTrend) => {
    const isPositive = userTrend > avgTrend;
    return (
      <span className={`${styles.badge} ${isPositive ? styles.goodBadge : styles.badBadge}`}>
        <span className={styles.badgeIcon}>{isPositive ? '↑' : '↓'}</span>
        <span>{isPositive ? 'Faster' : 'Slower'} than peers</span>
      </span>
    );
  }, []);

  const renderProgressBar = useCallback((userValue, avgValue, isReverse = false) => {
    const percentage = avgValue > 0 ? Math.min((userValue / avgValue) * 100, 200) : 0;
    const normalizedPercentage = isReverse ? Math.max(0, 200 - percentage) : percentage;
    
    return (
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${Math.min(normalizedPercentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }, []);

  if (loading && !hasEnoughPeers && !Object.values(metrics).some(m => m.loaded)) {
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

  if (!hasEnoughPeers && data) {
    return (
      <div className={styles.emptyStateContainer}>
        <h3>We need a little more time!</h3>
        <p>{data.message || "Not enough peers in your group yet. We will start comparing once more people with similar profiles join!"}</p>
      </div>
    );
  }

  const MetricCard = ({ metricKey, title, icon, gradient, metric }) => {
    if (!metric.loaded) {
      return (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <div className={styles.iconWrapper} style={{ background: gradient }}>
                {icon}
              </div>
              <h3>{title}</h3>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.spinner}></div>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>Loading {title}...</p>
          </div>
        </div>
      );
    }

    const { data: metricData } = metric;
    if (!metricData) return null;

    return (
      <>
        {metricKey === 'totalSpending' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleGroup}>
                <div className={styles.iconWrapper} style={{ background: gradient }}>
                  💸
                </div>
                <h3>Total Spending</h3>
              </div>
              <InfoIcon metricKey="totalSpending" onShowInfo={handleShowInfo} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statRow}>
                <span className={styles.label}>You</span>
                <span className={styles.value}>Rs. {metricData.userAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.progressSection}>
                {renderProgressBar(metricData.userAmount, metricData.averageAmount)}
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Peer Avg</span>
                <span className={styles.value}>Rs. {metricData.averageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              {getPercentileBadge(metricData.percentile, false)}
            </div>
            <div className={styles.actionableTip}>
              <p>{metricData.tip}</p>
            </div>
          </div>
        )}

        {metricKey === 'savingsRate' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleGroup}>
                <div className={styles.iconWrapper} style={{ background: gradient }}>
                  💰
                </div>
                <h3>Savings Rate</h3>
              </div>
              <InfoIcon metricKey="savingsRate" onShowInfo={handleShowInfo} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statRow}>
                <span className={styles.label}>You</span>
                <span className={styles.value}>{metricData.userRate.toFixed(1)}%</span>
              </div>
              <div className={styles.progressSection}>
                {renderProgressBar(metricData.userRate, metricData.averageRate, true)}
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Peer Avg</span>
                <span className={styles.value}>{metricData.averageRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              {getPercentileBadge(metricData.percentile, true)}
            </div>
            <div className={styles.actionableTip}>
              <p>{metricData.tip}</p>
            </div>
          </div>
        )}

        {metricKey === 'discretionary' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleGroup}>
                <div className={styles.iconWrapper} style={{ background: gradient }}>
                  🛍️
                </div>
                <h3>Discretionary Spending</h3>
              </div>
              <InfoIcon metricKey="discretionary" onShowInfo={handleShowInfo} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statRow}>
                <span className={styles.label}>You</span>
                <span className={styles.value}>{metricData.userRatio.toFixed(1)}% of budget</span>
              </div>
              <div className={styles.progressSection}>
                {renderProgressBar(metricData.userRatio, metricData.averageRatio)}
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Peer Avg</span>
                <span className={styles.value}>{metricData.averageRatio.toFixed(1)}% of budget</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              {getPercentileBadge(metricData.percentile, false)}
            </div>
            <div className={styles.actionableTip}>
              <p>{metricData.tip}</p>
            </div>
          </div>
        )}

        {metricKey === 'trend' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleGroup}>
                <div className={styles.iconWrapper} style={{ background: gradient }}>
                  📈
                </div>
                <h3>Savings Trend</h3>
              </div>
              <InfoIcon metricKey="trend" onShowInfo={handleShowInfo} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statRow}>
                <span className={styles.label}>You (MoM)</span>
                <span className={styles.value}>{metricData.userTrend > 0 ? '+' : ''}{metricData.userTrend.toFixed(1)}%</span>
              </div>
              <div className={styles.progressSection}>
                {/* No progress bar for trend, just the numbers */}
              </div>
              <div className={styles.statRow}>
                <span className={styles.label}>Peer Avg (MoM)</span>
                <span className={styles.value}>{metricData.averageTrend > 0 ? '+' : ''}{metricData.averageTrend.toFixed(1)}%</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              {getTrendBadge(metricData.userTrend, metricData.averageTrend)}
            </div>
            <div className={styles.actionableTip}>
              <p>{metricData.tip}</p>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.container}>
      <InfoModal metric={selectedMetric} onClose={handleCloseInfo} />
      
      <div className={styles.header}>
        <h2>Anonymous Benchmarking</h2>
        <p>See how your financial habits compare to {peerGroupSize} peers with a similar profile.</p>
      </div>

      <div className={styles.cardsGrid}>
        {/* Total Spending Card */}
        <MetricCard 
          metricKey="totalSpending" 
          title="Total Spending" 
          icon="💸"
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          metric={metrics.totalSpending}
        />

        {/* Savings Rate Card */}
        <MetricCard 
          metricKey="savingsRate" 
          title="Savings Rate" 
          icon="💰"
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          metric={metrics.savingsRate}
        />

        {/* Discretionary Spending Card */}
        <MetricCard 
          metricKey="discretionary" 
          title="Discretionary Spending" 
          icon="🛍️"
          gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
          metric={metrics.discretionary}
        />

        {/* Trend Card */}
        <MetricCard 
          metricKey="trend" 
          title="Savings Trend" 
          icon="📈"
          gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
          metric={metrics.trend}
        />
      </div>
    </div>
  );
};

export default memo(PeerComparison);
