using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MoneyMatesAPI.Controllers
{
    public class PeerMetric
    {
        public decimal TotalSpending { get; set; }
        public decimal SavingsRate { get; set; }
        public decimal DiscretionaryRatio { get; set; }
        public decimal Trend { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class AIInsightsController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public AIInsightsController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        [HttpGet("peer-comparison/{userId}")]
        public async Task<IActionResult> GetPeerComparison(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                // Define essential categories
                var essentialCategories = new[] { "Food", "Housing", "Utilities", "Healthcare", "Transport" };

                // Get peers based on IncomeBracket if available, otherwise use all users
                List<int> peers;
                if (!string.IsNullOrEmpty(user.IncomeBracket))
                {
                    peers = await _context.Users
                        .Where(u => !string.IsNullOrEmpty(u.IncomeBracket) && u.IncomeBracket == user.IncomeBracket)
                        .Select(u => u.Id)
                        .ToListAsync();
                }
                else
                {
                    peers = await _context.Users
                        .Select(u => u.Id)
                        .ToListAsync();
                }

                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);
                
                var startOfLastMonth = startOfMonth.AddMonths(-1);
                var endOfLastMonth = startOfMonth.AddDays(-1);

                // Load ONLY necessary data with database-level filtering for performance
                var peerExpenses = await _context.Expenses
                    .Where(e => peers.Contains(e.UserId) && e.DateAdded >= startOfLastMonth)
                    .ToListAsync();
                
                var peerIncomes = await _context.Income
                    .Where(i => peers.Contains(i.UserId) && i.DateAdded >= startOfLastMonth)
                    .ToListAsync();

                // Split data by month in memory
                var currentMonthExpenses = peerExpenses.Where(e => e.DateAdded >= startOfMonth && e.DateAdded <= endOfMonth).ToList();
                var currentMonthIncomes = peerIncomes.Where(i => i.DateAdded >= startOfMonth && i.DateAdded <= endOfMonth).ToList();
                var lastMonthExpenses = peerExpenses.Where(e => e.DateAdded >= startOfLastMonth && e.DateAdded < startOfMonth).ToList();
                var lastMonthIncomes = peerIncomes.Where(i => i.DateAdded >= startOfLastMonth && i.DateAdded < startOfMonth).ToList();

                // If no data in current month, use last month's data for comparison
                if (!currentMonthExpenses.Any() && !currentMonthIncomes.Any())
                {
                    currentMonthExpenses = lastMonthExpenses;
                    currentMonthIncomes = lastMonthIncomes;
                }

                // User Metrics (using current month data)
                var userExpenseList = currentMonthExpenses.Where(e => e.UserId == userId).ToList();
                var userIncomeList = currentMonthIncomes.Where(i => i.UserId == userId).ToList();
                
                var userTotalSpending = userExpenseList.Sum(e => e.Amount);
                var userTotalIncome = Math.Max(0, userIncomeList.Sum(i => i.Amount));
                var userSavingsRate = userTotalIncome > 0 ? ((userTotalIncome - userTotalSpending) / userTotalIncome) * 100 : 0;

                var userDiscretionarySpending = userExpenseList.Where(e => !essentialCategories.Contains(e.Category ?? "")).Sum(e => e.Amount);
                var userDiscretionaryRatio = userTotalIncome > 0 ? (userDiscretionarySpending / userTotalIncome) * 100 : 0;

                // User Trend (using last month data)
                var userPrevExpenseList = lastMonthExpenses.Where(e => e.UserId == userId).ToList();
                var userPrevIncomeList = lastMonthIncomes.Where(i => i.UserId == userId).ToList();
                var userPrevTotalSpending = userPrevExpenseList.Sum(e => e.Amount);
                var userPrevTotalIncome = Math.Max(0, userPrevIncomeList.Sum(i => i.Amount));
                var userPrevSavingsRate = userPrevTotalIncome > 0 ? ((userPrevTotalIncome - userPrevTotalSpending) / userPrevTotalIncome) * 100 : 0;
                var userTrend = userSavingsRate - userPrevSavingsRate;

                // Peer Metrics Calculation - optimized with LINQ
                var peerMetrics = peers
                    .Where(pId => pId != userId) // Exclude user from peer calculations
                    .Select(pId =>
                    {
                        var pExpenseList = currentMonthExpenses.Where(e => e.UserId == pId).ToList();
                        var pIncomeList = currentMonthIncomes.Where(i => i.UserId == pId).ToList();
                        
                        var pTotalSpending = pExpenseList.Sum(e => e.Amount);
                        var pTotalIncome = Math.Max(0, pIncomeList.Sum(i => i.Amount));
                        var pSavingsRate = pTotalIncome > 0 ? ((pTotalIncome - pTotalSpending) / pTotalIncome) * 100 : 0;

                        var pDiscretionarySpending = pExpenseList.Where(e => !essentialCategories.Contains(e.Category ?? "")).Sum(e => e.Amount);
                        var pDiscretionaryRatio = pTotalIncome > 0 ? (pDiscretionarySpending / pTotalIncome) * 100 : 0;

                        var pPrevExpenseList = lastMonthExpenses.Where(e => e.UserId == pId).ToList();
                        var pPrevIncomeList = lastMonthIncomes.Where(i => i.UserId == pId).ToList();
                        var pPrevTotalSpending = pPrevExpenseList.Sum(e => e.Amount);
                        var pPrevTotalIncome = Math.Max(0, pPrevIncomeList.Sum(i => i.Amount));
                        var pPrevSavingsRate = pPrevTotalIncome > 0 ? ((pPrevTotalIncome - pPrevTotalSpending) / pPrevTotalIncome) * 100 : 0;
                        var pTrend = pSavingsRate - pPrevSavingsRate;

                        return new PeerMetric { 
                            TotalSpending = pTotalSpending, 
                            SavingsRate = pSavingsRate, 
                            DiscretionaryRatio = pDiscretionaryRatio, 
                            Trend = pTrend 
                        };
                    })
                    .ToList();

                return Ok(new
                {
                    hasEnoughPeers = true,
                    peerGroupSize = peerMetrics.Count + 1, // +1 for the user themselves
                    totalSpending = new
                    {
                        userAmount = userTotalSpending,
                        averageAmount = peerMetrics.Any() ? peerMetrics.Average(p => p.TotalSpending) : 0m,
                        percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.TotalSpending < userTotalSpending) / (double)peerMetrics.Count) * 100) : 0,
                        tip = GetSpendingTip(peerMetrics, userTotalSpending)
                    },
                    savingsRate = new
                    {
                        userRate = userSavingsRate,
                        averageRate = peerMetrics.Any() ? peerMetrics.Average(p => p.SavingsRate) : 0m,
                        percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.SavingsRate < userSavingsRate) / (double)peerMetrics.Count) * 100) : 0,
                        tip = GetSavingsTip(peerMetrics, userSavingsRate)
                    },
                    discretionary = new
                    {
                        userRatio = userDiscretionaryRatio,
                        averageRatio = peerMetrics.Any() ? peerMetrics.Average(p => p.DiscretionaryRatio) : 0m,
                        userAmount = userDiscretionarySpending,
                        percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.DiscretionaryRatio < userDiscretionaryRatio) / (double)peerMetrics.Count) * 100) : 0,
                        tip = GetDiscretionaryTip(userDiscretionaryRatio)
                    },
                    trend = new
                    {
                        userTrend = userTrend,
                        averageTrend = peerMetrics.Any() ? peerMetrics.Average(p => p.Trend) : 0,
                        tip = GetTrendTip(peerMetrics, userTrend)
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPeerComparison: {ex.Message}\n{ex.StackTrace}");
                if (ex.InnerException != null) {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // Helper methods for tips
        private string GetSpendingTip(List<PeerMetric> peerMetrics, decimal userTotal)
        {
            var spendingPercentile = peerMetrics.Any() ? (peerMetrics.Count(p => p.TotalSpending < userTotal) / (double)peerMetrics.Count) * 100 : 0;
            return spendingPercentile > 50 ? "Consider reducing your top discretionary expense by 10% to reach the top 50%." : "You are spending less than most peers. Keep it up!";
        }

        private string GetSavingsTip(List<PeerMetric> peerMetrics, decimal userRate)
        {
            var savingsPercentile = peerMetrics.Any() ? (peerMetrics.Count(p => p.SavingsRate < userRate) / (double)peerMetrics.Count) * 100 : 0;
            return savingsPercentile < 50 ? "Your peers save more on average. Try setting aside 5% of your income automatically." : "You are in the top half of savers in your group!";
        }

        private string GetDiscretionaryTip(decimal userRatio)
        {
            return userRatio > 30 ? "Your discretionary spending is high. Limit non-essentials to 30% of your budget." : "Great job keeping discretionary spending low!";
        }

        private string GetTrendTip(List<PeerMetric> peerMetrics, decimal userTrend)
        {
            var avgTrend = peerMetrics.Any() ? peerMetrics.Average(p => p.Trend) : 0m;
            return userTrend < avgTrend ? "Your savings trend is dropping compared to your peers. Review last month's expenses." : "Your financial habits are improving faster than your peers!";
        }

        [HttpGet("financial-health/{userId}")]
        public async Task<IActionResult> GetFinancialHealth(int userId)
        {
            try
            {
                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

                var startOfPrevMonth = startOfMonth.AddMonths(-1);
                var endOfPrevMonth = startOfMonth.AddDays(-1);

                // Fetch data
                var expenses = await _context.Expenses.Where(e => e.UserId == userId && e.DateAdded >= startOfMonth && e.DateAdded <= endOfMonth).ToListAsync();
                var incomes = await _context.Income.Where(i => i.UserId == userId && i.DateAdded >= startOfMonth && i.DateAdded <= endOfMonth).ToListAsync();
                var budgets = await _context.Budgets.Where(b => b.UserId == userId).ToListAsync();
                
                var prevExpenses = await _context.Expenses.Where(e => e.UserId == userId && e.DateAdded >= startOfPrevMonth && e.DateAdded <= endOfPrevMonth).ToListAsync();
                var prevIncomes = await _context.Income.Where(i => i.UserId == userId && i.DateAdded >= startOfPrevMonth && i.DateAdded <= endOfPrevMonth).ToListAsync();

                // Current Month Totals
                var totalExpenses = expenses.Sum(e => e.Amount);
                var totalIncome = Math.Max(0, incomes.Sum(i => i.Amount)); // Clamp negative income

                // Prev Month Totals
                var prevTotalExpenses = prevExpenses.Sum(e => e.Amount);
                var prevTotalIncome = Math.Max(0, prevIncomes.Sum(i => i.Amount));

                // Savings Ratio
                var savingsRatio = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
                var prevSavingsRatio = prevTotalIncome > 0 ? ((prevTotalIncome - prevTotalExpenses) / prevTotalIncome) * 100 : 0;

                double savingsScore = 0;
                if (totalIncome == 0) savingsScore = 0;
                else if (savingsRatio > 50) savingsScore = 95 + (Math.Min((double)savingsRatio - 50, 50) / 50) * 5;
                else if (savingsRatio >= 30) savingsScore = 80 + (((double)savingsRatio - 30) / 20) * 15;
                else if (savingsRatio >= 10) savingsScore = 60 + (((double)savingsRatio - 10) / 20) * 20;
                else if (savingsRatio >= 0) savingsScore = 40 + ((double)savingsRatio / 10) * 20;
                else savingsScore = Math.Max(0, 40 + ((double)savingsRatio / 10) * 40);

                // MoM Trend (replaces Expense Ratio)
                var momTrend = prevTotalIncome > 0 ? savingsRatio - prevSavingsRatio : 0;
                double momScore = 0;
                if (totalIncome == 0) momScore = 0;
                else if (momTrend >= 5) momScore = 90 + (Math.Min((double)momTrend - 5, 5) / 5) * 10;
                else if (momTrend >= 0) momScore = 75 + ((double)momTrend / 5) * 15;
                else if (momTrend >= -5) momScore = 60 + (((double)momTrend + 5) / 5) * 15;
                else if (momTrend >= -10) momScore = 40 + (((double)momTrend + 10) / 5) * 20;
                else momScore = Math.Max(0, 40 - (((double)-momTrend - 10) / 10) * 40);

                // Budget Adherence
                double totalAdherenceScore = 0;
                int categoryCount = 0;
                
                var categoryExpenses = expenses.GroupBy(e => e.Category).ToDictionary(g => g.Key, g => g.Sum(e => e.Amount), StringComparer.OrdinalIgnoreCase);

                foreach (var budget in budgets)
                {
                    decimal spent = categoryExpenses.ContainsKey(budget.Category) ? categoryExpenses[budget.Category] : 0;
                    
                    double adherenceRatio = 0;
                    if (budget.Limit <= 0) 
                    {
                        adherenceRatio = spent > 0 ? 200 : 0; // Zero budget guard
                    }
                    else 
                    {
                        adherenceRatio = (double)((spent / budget.Limit) * 100);
                    }

                    double categoryScore = 0;
                    if (adherenceRatio < 80) categoryScore = 90 + (((80 - adherenceRatio) / 80) * 10);
                    else if (adherenceRatio <= 100) categoryScore = 75 + (((100 - adherenceRatio) / 20) * 15);
                    else if (adherenceRatio <= 120) categoryScore = 50 + (((120 - adherenceRatio) / 20) * 25);
                    else categoryScore = Math.Max(0, 50 - ((adherenceRatio - 120) / 100) * 50);

                    totalAdherenceScore += categoryScore;
                    categoryCount++;
                }

                double budgetScore = categoryCount > 0 ? Math.Round(totalAdherenceScore / categoryCount) : 75;

                // Final Combined Score
                double overallScore = Math.Round((savingsScore * 0.35) + (budgetScore * 0.35) + (momScore * 0.3));

                // Status
                string statusText = "";
                string statusColor = "";
                string statusIcon = "";
                if (overallScore >= 90) { statusText = "Excellent"; statusColor = "#27ae60"; statusIcon = "🟢"; }
                else if (overallScore >= 80) { statusText = "Good"; statusColor = "#2ecc71"; statusIcon = "🟢"; }
                else if (overallScore >= 70) { statusText = "Fair"; statusColor = "#f39c12"; statusIcon = "🟡"; }
                else if (overallScore >= 60) { statusText = "Poor"; statusColor = "#e67e22"; statusIcon = "🟠"; }
                else { statusText = "Critical"; statusColor = "#e74c3c"; statusIcon = "🔴"; }

                var response = new
                {
                    overallScore = overallScore,
                    status = new { status = statusText, color = statusColor, icon = statusIcon },
                    metrics = new
                    {
                        savings = new
                        {
                            score = Math.Round(savingsScore),
                            label = "Savings Ratio",
                            weight = 35,
                            details = new
                            {
                                totalIncome = totalIncome,
                                totalExpenses = totalExpenses,
                                totalSavings = totalIncome - totalExpenses,
                                savingsPercentage = savingsRatio
                            }
                        },
                        budget = new
                        {
                            score = budgetScore,
                            label = "Budget Adherence",
                            weight = 35,
                            details = new
                            {
                                categoriesTracked = categoryCount,
                                categoryBreakdown = categoryExpenses.Select(kvp => new { category = kvp.Key, total = kvp.Value }).ToList()
                            }
                        },
                        trend = new
                        {
                            score = Math.Round(momScore),
                            label = "MoM Savings Trend",
                            weight = 30,
                            details = new
                            {
                                prevSavingsPercentage = prevSavingsRatio,
                                currentSavingsPercentage = savingsRatio,
                                trendDifference = momTrend
                            }
                        }
                    },
                    summary = new
                    {
                        totalIncome = totalIncome,
                        totalExpenses = totalExpenses,
                        totalSavings = totalIncome - totalExpenses,
                        month = startOfMonth.ToString("MMMM yyyy")
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
