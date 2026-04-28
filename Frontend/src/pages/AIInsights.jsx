import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import FinancialHealthTracker from '../components/FinancialHealthTracker';
import SpendingPatterns from '../components/SpendingPatterns';
import PeerComparison from '../components/PeerComparison';
import dashboardStyles from '../components/dashboard/Dashboard.module.css';
import styles from './AIInsights.module.css';

const AIInsights = () => {
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('health');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserId(user.userID);
    }
  }, []);

  return (
    <div className={dashboardStyles.dashboardLayout}>
      <Sidebar />

      <main className={dashboardStyles.mainContent}>
        <section className={dashboardStyles.heroSection}>
          <div className={dashboardStyles.heroContent}>
            <div>
              <h1>AI Insights</h1>
              <p className={dashboardStyles.heroSubtitle}>Get intelligent financial analysis powered by AI</p>
            </div>
          </div>
        </section>

        {userId && (
          <>
            <div className={styles.tabContainer}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'health' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('health')}
              >
                Financial Health
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'patterns' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('patterns')}
              >
                Spending Patterns
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'comparison' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                Peer Comparison
              </button>
            </div>

            <section className={styles.aiContent}>
              {activeTab === 'health' && (
                <FinancialHealthTracker userId={userId} />
              )}
              {activeTab === 'patterns' && (
                <SpendingPatterns userId={userId} />
              )}
              {activeTab === 'comparison' && (
                <PeerComparison userId={userId} />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AIInsights;
