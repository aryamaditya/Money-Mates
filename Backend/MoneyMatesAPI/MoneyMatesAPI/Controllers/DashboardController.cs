using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;  // must match your project namespace

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
            var totalSavings = totalBalance; // adjust if you want custom logic

            return Ok(new
            {
                totalBalance,
                totalIncome,
                totalExpenses,
                totalSavings
            });
        }
    }
}
