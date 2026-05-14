import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import FinancialHealthTracker from '../components/FinancialHealthTracker';
import SpendingPatterns from '../components/SpendingPatterns';
import PeerComparison from '../components/PeerComparison';
import SavingSuggestions from '../components/SavingSuggestions';
import CategoryPrediction from '../components/CategoryPrediction';
import dashboardStyles from '../components/dashboard/Dashboard.module.css';
import styles from './AIInsights.module.css';
import { FaHeartbeat, FaChartLine, FaUsers, FaBrain, FaRobot, FaLightbulb, FaClock } from 'react-icons/fa';

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
        <section className={styles.enhancedHeroSection}>
          {/* Animated Background Elements */}
          <div className={styles.heroGradientBg}>
            <div className={styles.animatedGradient}></div>
            <div className={styles.gradientCircle1}></div>
            <div className={styles.gradientCircle2}></div>
            <div className={styles.gradientCircle3}></div>
            
            {/* Floating Animated Icons */}
            <div className={styles.heroFloatingIcons}>
              <FaBrain className={styles.floatingIcon1} />
              <FaRobot className={styles.floatingIcon2} />
            </div>

            {/* Animated Grid Background */}
            <div className={styles.gridPattern}></div>
          </div>

          <div className={styles.heroContent}>
            {/* Left Section */}
            <div className={styles.heroTextSection}>
              <div className={styles.heroTopBadge}>
                <span className={styles.badgePulse}></span>
                <span className={styles.badgeText}>Powered by Advanced AI</span>
              </div>
              
              <h1 className={styles.heroTitle}>
                <span className={styles.titleGradient}>Financial Intelligence</span>
                <span className={styles.titleHighlight}> at Your Fingertips</span>
              </h1>
              
              <p className={styles.heroDescription}>
                Leverage cutting-edge AI technology to unlock deep insights into your spending habits, financial health, and compare yourself with the Money-Mates community.
              </p>

              <div className={styles.heroFeatures}>
                <div className={styles.featureItem}>
                  <div className={styles.featureDot}></div>
                  <span>Smart AI Analysis</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureDot}></div>
                  <span>Real-Time Predictions</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureDot}></div>
                  <span>Community Benchmarks</span>
                </div>
              </div>
            </div>

            {/* Right Section - Stats Cards */}
            <div className={styles.heroVisualsContainer}>
              <div className={styles.heroStat}>
                <div className={styles.statGlow}></div>
                <FaBrain className={styles.statIcon} />
                <span className={styles.statLabel}>AI-Powered</span>
                <span className={styles.statDescription}>Advanced algorithms</span>
              </div>
              
              <div className={styles.heroStat}>
                <div className={styles.statGlow}></div>
                <FaChartLine className={styles.statIcon} />
                <span className={styles.statLabel}>Real-Time</span>
                <span className={styles.statDescription}>Instant updates</span>
              </div>
              
              <div className={styles.heroStat}>
                <div className={styles.statGlow}></div>
                <FaUsers className={styles.statIcon} />
                <span className={styles.statLabel}>Community</span>
                <span className={styles.statDescription}>Peer insights</span>
              </div>
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
                <FaHeartbeat className={styles.tabIcon} />
                <span>Financial Health</span>
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'patterns' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('patterns')}
              >
                <FaChartLine className={styles.tabIcon} />
                <span>Spending Patterns</span>
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'suggestions' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('suggestions')}
              >
                <FaLightbulb className={styles.tabIcon} />
                <span>Saving Suggestions</span>
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'prediction' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('prediction')}
              >
                <FaClock className={styles.tabIcon} />
                <span>Category Prediction</span>
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'comparison' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                <FaUsers className={styles.tabIcon} />
                <span>Peer Comparison</span>
              </button>
            </div>

            <section className={styles.aiContent}>
              {activeTab === 'health' && (
                <FinancialHealthTracker userId={userId} />
              )}
              {activeTab === 'patterns' && (
                <SpendingPatterns userId={userId} />
              )}
              {activeTab === 'suggestions' && (
                <SavingSuggestions userId={userId} />
              )}
              {activeTab === 'prediction' && (
                <CategoryPrediction userId={userId} />
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
