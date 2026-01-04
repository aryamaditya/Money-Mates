using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public DashboardController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // ---------------------------
        // 1️⃣ Totals: balance, income, expenses, savings
        // GET: api/dashboard/totals/{userId}
        // ---------------------------
        [HttpGet("totals/{userId}")]
        public async Task<IActionResult> GetTotals(int userId)
        {
            var totalIncome = await _context.Income
                .Where(i => i.UserId == userId)
                .SumAsync(i => i.Amount);

            var totalExpenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .SumAsync(e => e.Amount);

            var totalBalance = totalIncome - totalExpenses;
            var totalSavings = totalBalance; // Adjust logic if needed

            return Ok(new
            {
                totalBalance,
                totalIncome,
                totalExpenses,
                totalSavings
            });
        }

        // ---------------------------
        // 2️⃣ Monthly Spending: income vs expenses
        // GET: api/dashboard/spending/{userId}
        // ---------------------------
        [HttpGet("spending/{userId}")]
        public async Task<IActionResult> GetMonthlySpending(int userId)
        {
            // Income grouped by month
            var incomeByMonth = await _context.Income
                .Where(i => i.UserId == userId)
                .GroupBy(i => i.DateAdded.Month)
                .Select(g => new { month = g.Key, Income = g.Sum(i => i.Amount) })
                .ToListAsync();

            // Expenses grouped by month
            var expenseByMonth = await _context.Expenses
                .Where(e => e.UserId == userId)
                .GroupBy(e => e.DateAdded.Month)
                .Select(g => new { month = g.Key, Expense = g.Sum(e => e.Amount) })
                .ToListAsync();

            // Merge into a full 12-month list
            var result = Enumerable.Range(1, 12)
                .Select(m => new
                {
                    month = m,
                    Income = incomeByMonth.FirstOrDefault(x => x.month == m)?.Income ?? 0,
                    Expense = expenseByMonth.FirstOrDefault(x => x.month == m)?.Expense ?? 0
                })
                .ToList();

            return Ok(result);
        }

        // ---------------------------
        // 3️⃣ Category breakdown (for pie chart)
        // GET: api/dashboard/categories/{userId}
        // ---------------------------
        [HttpGet("categories/{userId}")]
        public async Task<IActionResult> GetCategories(int userId)
        {
            var budgets = await _context.Budgets
                .Where(b => b.UserId == userId)
                .ToListAsync();

            var categories = budgets.Select(b => new
            {
                name = b.Category,           // use budget category name
                value = _context.Expenses
                            .Where(e => e.UserId == userId && e.Category == b.Category)
                            .Sum(e => e.Amount)   // total used amount
            }).ToList();

            return Ok(categories);
        }

    }
}
