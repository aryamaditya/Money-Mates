using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

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
                    description = e.Category,
                    e.Amount
                })
                .ToListAsync();

            return Ok(recent);
        }

        // GET: api/expenses/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserExpenses(int userId)
        {
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.DateAdded)
                .ToListAsync();

            return Ok(expenses);
        }

        // POST: api/expenses
        [HttpPost]
        public async Task<IActionResult> AddExpense([FromBody] Expense expense)
        {
            if (expense == null)
                return BadRequest(new { message = "Invalid expense data." });

            expense.DateAdded = DateTime.Now;
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return Ok(expense);
        }

        // DELETE: api/expenses/{expenseId}
        [HttpDelete("{expenseId}")]
        public async Task<IActionResult> DeleteExpense(int expenseId)
        {
            var expense = await _context.Expenses.FindAsync(expenseId);
            if (expense == null)
                return NotFound(new { message = "Expense not found." });

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Expense deleted successfully." });
        }
    }
}
