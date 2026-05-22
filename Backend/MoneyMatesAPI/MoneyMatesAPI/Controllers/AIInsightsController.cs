using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;
using MoneyMatesAPI.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MoneyMatesAPI.Controllers
{
    public class PeerMetric
    {
        public int PeerId { get; set; }  // ✅ Track peer ID for filtering later
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
        private readonly IGroqAIService _groqAIService;

        public AIInsightsController(MoneyMatesDbContext context, IGroqAIService groqAIService)
        {
            _context = context;
            _groqAIService = groqAIService;
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

                // ✅ DATABASE-LEVEL AGGREGATION: Use direct Sum queries to let SQL aggregate
                // Get current month user metrics
                var userTotalSpending = await _context.Expenses
                    .Where(e => e.UserId == userId && e.DateAdded >= startOfMonth && e.DateAdded <= endOfMonth)
                    .SumAsync(e => e.Amount);

                var userTotalIncome = Math.Max(0, await _context.Income
                    .Where(i => i.UserId == userId && i.DateAdded >= startOfMonth && i.DateAdded <= endOfMonth)
                    .SumAsync(i => i.Amount));

                var userDiscretionarySpending = await _context.Expenses
                    .Where(e => e.UserId == userId && e.DateAdded >= startOfMonth && e.DateAdded <= endOfMonth && 
                                (e.Category != "Food" && e.Category != "Housing" && e.Category != "Utilities" && 
                                 e.Category != "Healthcare" && e.Category != "Transport"))
                    .SumAsync(e => e.Amount);

                var userSavingsRate = userTotalIncome > 0 ? ((userTotalIncome - userTotalSpending) / userTotalIncome) * 100 : 0;
                var userDiscretionaryRatio = userTotalIncome > 0 ? (userDiscretionarySpending / userTotalIncome) * 100 : 0;

                // Get last month user metrics for trend
                var userPrevTotalSpending = await _context.Expenses
                    .Where(e => e.UserId == userId && e.DateAdded >= startOfLastMonth && e.DateAdded < startOfMonth)
                    .SumAsync(e => e.Amount);

                var userPrevTotalIncome = Math.Max(0, await _context.Income
                    .Where(i => i.UserId == userId && i.DateAdded >= startOfLastMonth && i.DateAdded < startOfMonth)
                    .SumAsync(i => i.Amount));

                var userPrevSavingsRate = userPrevTotalIncome > 0 ? ((userPrevTotalIncome - userPrevTotalSpending) / userPrevTotalIncome) * 100 : 0;
                var userTrend = userSavingsRate - userPrevSavingsRate;

                // ✅ DATABASE-LEVEL AGGREGATION: Get all peer metrics grouped in SQL
                // This returns only aggregated values per peer, not 100,000 individual rows
                var peerExpenseData = await _context.Expenses
                    .Where(e => peers.Contains(e.UserId) && e.UserId != userId && e.DateAdded >= startOfMonth && e.DateAdded <= endOfMonth)
                    .ToListAsync();  // Fetch to memory
                
                var peerExpenseMetrics = peerExpenseData
                    .GroupBy(e => e.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        TotalSpending = g.Sum(e => e.Amount),
                        DiscretionarySpending = g
                            .Where(e => e.Category != "Food" && e.Category != "Housing" && e.Category != "Utilities" && 
                                       e.Category != "Healthcare" && e.Category != "Transport")
                            .Sum(e => e.Amount)
                    })
                    .ToList();

                var peerIncomeMetrics = await _context.Income
                    .Where(i => peers.Contains(i.UserId) && i.UserId != userId && i.DateAdded >= startOfMonth && i.DateAdded <= endOfMonth)
                    .GroupBy(i => i.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        TotalIncome = g.Sum(i => i.Amount)
                    })
                    .ToListAsync();

                // Get last month metrics for trend calculation
                var peerLastExpenseMetrics = await _context.Expenses
                    .Where(e => peers.Contains(e.UserId) && e.UserId != userId && e.DateAdded >= startOfLastMonth && e.DateAdded < startOfMonth)
                    .GroupBy(e => e.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        TotalSpending = g.Sum(e => e.Amount)
                    })
                    .ToListAsync();

                var peerLastIncomeMetrics = await _context.Income
                    .Where(i => peers.Contains(i.UserId) && i.UserId != userId && i.DateAdded >= startOfLastMonth && i.DateAdded < startOfMonth)
                    .GroupBy(i => i.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        TotalIncome = g.Sum(i => i.Amount)
                    })
                    .ToListAsync();

                // Convert to dictionaries for O(1) lookup
                var peerExpenseDict = peerExpenseMetrics.ToDictionary(x => x.UserId);
                var peerIncomeDict = peerIncomeMetrics.ToDictionary(x => x.UserId);
                var peerLastExpenseDict = peerLastExpenseMetrics.ToDictionary(x => x.UserId);
                var peerLastIncomeDict = peerLastIncomeMetrics.ToDictionary(x => x.UserId);

                // ✅ MEMORY CALCULATION: Now working with aggregated data (100 rows), not 100,000 rows
                var peerMetrics = peers
                    .Where(pId => pId != userId)
                    .Select(pId =>
                    {
                        var pTotalSpending = peerExpenseDict.ContainsKey(pId) ? peerExpenseDict[pId].TotalSpending : 0m;
                        var pDiscretionarySpending = peerExpenseDict.ContainsKey(pId) ? peerExpenseDict[pId].DiscretionarySpending : 0m;
                        var pTotalIncome = Math.Max(0, peerIncomeDict.ContainsKey(pId) ? peerIncomeDict[pId].TotalIncome : 0m);

                        var pSavingsRate = pTotalIncome > 0 ? ((pTotalIncome - pTotalSpending) / pTotalIncome) * 100 : 0;
                        var pDiscretionaryRatio = pTotalIncome > 0 ? (pDiscretionarySpending / pTotalIncome) * 100 : 0;

                        var pPrevTotalSpending = peerLastExpenseDict.ContainsKey(pId) ? peerLastExpenseDict[pId].TotalSpending : 0m;
                        var pPrevTotalIncome = Math.Max(0, peerLastIncomeDict.ContainsKey(pId) ? peerLastIncomeDict[pId].TotalIncome : 0m);
                        var pPrevSavingsRate = pPrevTotalIncome > 0 ? ((pPrevTotalIncome - pPrevTotalSpending) / pPrevTotalIncome) * 100 : 0;
                        var pTrend = pSavingsRate - pPrevSavingsRate;

                        return new PeerMetric
                        {
                            PeerId = pId,  // ✅ Store peer ID
                            TotalSpending = pTotalSpending,
                            SavingsRate = pSavingsRate,
                            DiscretionaryRatio = pDiscretionaryRatio,
                            Trend = pTrend
                        };
                    })
                    .ToList();

                // Generate AI insights for each metric using Groq
                // ✅ BUG FIX 1: Only average peers who have expenses in current month (not zeros)
                var peerIdsWithCurrentExpenses = new HashSet<int>(peerExpenseMetrics.Select(p => p.UserId));
                var peerMetricsWithExpenses = peerMetrics.Where(p => peerIdsWithCurrentExpenses.Contains(p.PeerId)).ToList();
                
                var spendingMetricData = new
                {
                    userAmount = userTotalSpending,
                    averageAmount = peerMetricsWithExpenses.Any() ? peerMetricsWithExpenses.Average(p => p.TotalSpending) : 0m,
                    percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.TotalSpending < userTotalSpending) / (double)peerMetrics.Count) * 100) : 0
                };

                var savingsMetricData = new
                {
                    userRate = userSavingsRate,
                    averageRate = peerMetrics.Any() ? peerMetrics.Average(p => p.SavingsRate) : 0m,
                    percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.SavingsRate < userSavingsRate) / (double)peerMetrics.Count) * 100) : 0
                };

                var discretionaryMetricData = new
                {
                    userRatio = userDiscretionaryRatio,
                    averageRatio = peerMetrics.Any() ? peerMetrics.Average(p => p.DiscretionaryRatio) : 0m,
                    userAmount = userDiscretionarySpending,
                    percentile = peerMetrics.Any() ? Math.Round((decimal)(peerMetrics.Count(p => p.DiscretionaryRatio < userDiscretionaryRatio) / (double)peerMetrics.Count) * 100) : 0
                };

                // ✅ BUG FIX 2: Only average trends for peers with data in BOTH months
                var peerIdsWithPreviousExpenses = new HashSet<int>(peerLastExpenseMetrics.Select(p => p.UserId));
                var peerMetricsWithBothMonths = peerMetrics.Where(p => peerIdsWithCurrentExpenses.Contains(p.PeerId) && peerIdsWithPreviousExpenses.Contains(p.PeerId)).ToList();
                
                var trendMetricData = new
                {
                    userTrend = userTrend,
                    averageTrend = peerMetricsWithBothMonths.Any() ? peerMetricsWithBothMonths.Average(p => p.Trend) : 0m
                };

                // Call Groq AI in PARALLEL to generate insights faster (instead of sequential await)
                var spendingTask = _groqAIService.GenerateInsightAsync("spending", spendingMetricData);
                var savingsTask = _groqAIService.GenerateInsightAsync("savings", savingsMetricData);
                var discretionaryTask = _groqAIService.GenerateInsightAsync("discretionary", discretionaryMetricData);
                var trendTask = _groqAIService.GenerateInsightAsync("trend", trendMetricData);

                // Wait for all 4 requests to complete
                await Task.WhenAll(spendingTask, savingsTask, discretionaryTask, trendTask);

                var spendingTip = spendingTask.Result;
                var savingsTip = savingsTask.Result;
                var discretionaryTip = discretionaryTask.Result;
                var trendTip = trendTask.Result;

                return Ok(new
                {
                    hasEnoughPeers = true,
                    peerGroupSize = peerMetrics.Count + 1, // +1 for the user themselves
                    totalSpending = new
                    {
                        userAmount = userTotalSpending,
                        averageAmount = spendingMetricData.averageAmount,
                        percentile = spendingMetricData.percentile,
                        tip = spendingTip
                    },
                    savingsRate = new
                    {
                        userRate = userSavingsRate,
                        averageRate = savingsMetricData.averageRate,
                        percentile = savingsMetricData.percentile,
                        tip = savingsTip
                    },
                    discretionary = new
                    {
                        userRatio = userDiscretionaryRatio,
                        averageRatio = discretionaryMetricData.averageRatio,
                        userAmount = userDiscretionarySpending,
                        percentile = discretionaryMetricData.percentile,
                        tip = discretionaryTip
                    },
                    trend = new
                    {
                        userTrend = userTrend,
                        averageTrend = trendMetricData.averageTrend,
                        tip = trendTip
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
