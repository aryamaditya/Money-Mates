using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExpensesController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public ExpensesController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // GET: api/expenses/recent/{userId}
        [HttpGet("recent/{userId}")]
        public async Task<IActionResult> GetRecentExpenses(int userId)
        {
            var recent = await _context.Expenses
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.DateAdded)
                .Take(10)
                .Select(e => new
                {
                    e.Id,
                    dateAdded = e.DateAdded,
                    description = e.Category, // or replace with proper description field
                    e.Amount
                })
                .ToListAsync();

            return Ok(recent);
        }
    }
}
