using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public BudgetController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // POST: api/budget
        [HttpPost]
        public async Task<IActionResult> AddBudget([FromBody] Budget budget)
        {
            if (budget == null)
                return BadRequest(new { message = "Invalid budget data." });

            _context.Budgets.Add(budget);
            await _context.SaveChangesAsync();

            return Ok(budget);
        }

        // GET: api/budget/{userId} - get all budgets for a user
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserBudgets(int userId)
        {
            try
            {
                var budgets = await _context.Budgets
                    .Where(b => b.UserId == userId)
                    .ToListAsync();

                return Ok(budgets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // PUT: api/budget/{budgetId} - update a budget
        [HttpPut("{budgetId}")]
        public async Task<IActionResult> UpdateBudget(int budgetId, [FromBody] BudgetUpdateRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid budget data." });

            var budget = await _context.Budgets.FindAsync(budgetId);
            if (budget == null)
                return NotFound(new { message = "Budget not found." });

            budget.Limit = request.Limit;
            if (!string.IsNullOrEmpty(request.Category))
                budget.Category = request.Category;

            await _context.SaveChangesAsync();

            return Ok(budget);
        }

        // DELETE: api/budget/{budgetId} - delete a budget category
        [HttpDelete("{budgetId}")]
        public async Task<IActionResult> DeleteBudget(int budgetId)
        {
            var budget = await _context.Budgets.FindAsync(budgetId);
            if (budget == null)
                return NotFound(new { message = "Budget not found." });

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Budget deleted successfully." });
        }
    }

    public class BudgetUpdateRequest
    {
        public string? Category { get; set; }
        public decimal Limit { get; set; }
    }
}
