using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MoneyMatesAPI.Controllers
{
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
                // Calculate user totals
                var userIncome = await _context.Income.Where(i => i.UserId == userId).SumAsync(i => i.Amount);
                var userExpense = await _context.Expenses.Where(e => e.UserId == userId).SumAsync(e => e.Amount);
                var userSavingsRate = userIncome > 0 ? ((userIncome - userExpense) / userIncome) * 100 : 0;

                // Calculate global totals
                var allUsersIncome = await _context.Income.SumAsync(i => i.Amount);
                var allUsersExpense = await _context.Expenses.SumAsync(e => e.Amount);
                var totalUsers = await _context.Users.CountAsync(); // Total registered users
                
                // Avoid division by zero
                var avgUserExpense = totalUsers > 0 ? allUsersExpense / totalUsers : 0;
                var avgSavingsRate = allUsersIncome > 0 ? ((allUsersIncome - allUsersExpense) / allUsersIncome) * 100 : 0;

                // User's top 2 spending categories
                var topCategories = await _context.Expenses
                    .Where(e => e.UserId == userId)
                    .GroupBy(e => e.Category)
                    .Select(g => new { Category = g.Key, Amount = g.Sum(e => e.Amount) })
                    .OrderByDescending(x => x.Amount)
                    .Take(2)
                    .ToListAsync();

                var categoryComparisons = new List<object>();

                foreach (var cat in topCategories)
                {
                    // Global average for this specific category
                    var allUsersCatExpense = await _context.Expenses
                        .Where(e => e.Category == cat.Category)
                        .SumAsync(e => e.Amount);
                    
                    var avgCatExpense = totalUsers > 0 ? allUsersCatExpense / totalUsers : 0;

                    categoryComparisons.Add(new
                    {
                        category = cat.Category,
                        userAmount = cat.Amount,
                        averageAmount = avgCatExpense,
                        percentageDifference = avgCatExpense > 0 
                            ? ((cat.Amount - avgCatExpense) / avgCatExpense) * 100 
                            : (cat.Amount > 0 ? 100 : 0)
                    });
                }

                return Ok(new
                {
                    totalSpending = new
                    {
                        userAmount = userExpense,
                        averageAmount = avgUserExpense,
                        percentageDifference = avgUserExpense > 0 
                            ? ((userExpense - avgUserExpense) / avgUserExpense) * 100 
                            : (userExpense > 0 ? 100 : 0)
                    },
                    savingsRate = new
                    {
                        userRate = userSavingsRate,
                        averageRate = avgSavingsRate,
                        // Using absolute percentage points difference for savings rate
                        percentageDifference = userSavingsRate - avgSavingsRate
                    },
                    topCategories = categoryComparisons
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
