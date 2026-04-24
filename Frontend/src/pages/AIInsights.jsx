import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import FinancialHealthTracker from '../components/FinancialHealthTracker';
import dashboardStyles from '../components/dashboard/Dashboard.module.css';
import styles from './AIInsights.module.css';

const AIInsights = () => {
  const [userId, setUserId] = useState(null);

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

        {/* Financial Health Tracker */}
        {userId && (
          <section className={styles.aiContent}>
            <FinancialHealthTracker userId={userId} />
          </section>
        )}
      </main>
    </div>
  );
};

export default AIInsights;
