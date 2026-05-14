using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public CategoryController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // GET: api/category/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCategories(int userId)
        {
            var budgets = await _context.Budgets
                .Where(b => b.UserId == userId)
                .ToListAsync();

            // Get current month and year
            var now = DateTime.Now;
            var currentMonth = now.Month;
            var currentYear = now.Year;

            // Calculate used amount for CURRENT MONTH ONLY
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId 
                    && e.DateAdded.Month == currentMonth
                    && e.DateAdded.Year == currentYear)
                .ToListAsync();

            var result = budgets.Select(b =>
            {
                var used = expenses
                    .Where(e => e.Category == b.Category)
                    .Sum(e => e.Amount);
                return new
                {
                    b.Category,
                    Limit = b.Limit,
                    Used = used
                };
            });

            return Ok(result);
        }

        // PUT: api/category/{userId}/{categoryName}
        [HttpPut("{userId}/{categoryName}")]
        public async Task<IActionResult> UpdateCategoryLimit(int userId, string categoryName, [FromBody] CategoryUpdateRequest request)
        {
            if (request == null || request.NewLimit <= 0)
                return BadRequest(new { message = "Invalid limit value. Limit must be greater than 0." });

            try
            {
                var budget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.UserId == userId && b.Category == categoryName);

                if (budget != null)
                {
                    // Update existing
                    budget.Limit = request.NewLimit;
                    await _context.SaveChangesAsync();
                    return Ok(budget);
                }
                else
                {
                    // Insert new
                    var newBudget = new Budget
                    {
                        UserId = userId,
                        Category = categoryName,
                        Limit = request.NewLimit
                    };
                    _context.Budgets.Add(newBudget);
                    await _context.SaveChangesAsync();
                    return Ok(newBudget);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating category: {ex.Message}" });
            }
        }

        // GET: api/category/{userId}/{categoryName}/expenses
        [HttpGet("{userId}/{categoryName}/expenses")]
        public async Task<IActionResult> GetCategoryExpenses(int userId, string categoryName)
        {
            // Get current month and year
            var now = DateTime.Now;
            var currentMonth = now.Month;
            var currentYear = now.Year;

            // Get expenses for CURRENT MONTH ONLY
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId 
                    && e.Category == categoryName
                    && e.DateAdded.Month == currentMonth
                    && e.DateAdded.Year == currentYear)
                .OrderByDescending(e => e.DateAdded)
                .ToListAsync();

            return Ok(expenses);
        }

        // DELETE: api/category/{userId} - delete single category or all categories
        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteCategory(int userId, [FromQuery] string? categoryName = null)
        {
            try
            {
                // If categoryName is null, delete all categories
                if (string.IsNullOrEmpty(categoryName))
                {
                    var budgets = await _context.Budgets
                        .Where(b => b.UserId == userId)
                        .ToListAsync();

                    if (budgets.Count == 0)
                        return Ok(new { message = "No categories to delete." });

                    _context.Budgets.RemoveRange(budgets);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = $"Successfully deleted {budgets.Count} categories." });
                }
                else
                {
                    // Delete specific category
                    var budget = await _context.Budgets
                        .FirstOrDefaultAsync(b => b.UserId == userId && b.Category == categoryName);

                    if (budget == null)
                        return NotFound(new { message = "Category not found." });

                    _context.Budgets.Remove(budget);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Category deleted successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting category: {ex.Message}" });
            }
        }
    }

    public class CategoryUpdateRequest
    {
        public decimal NewLimit { get; set; }
    }
}
