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

            // Calculate used amount for each category
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId)
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

        // GET: api/category/{userId}/{categoryName}/expenses
        [HttpGet("{userId}/{categoryName}/expenses")]
        public async Task<IActionResult> GetCategoryExpenses(int userId, string categoryName)
        {
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId && e.Category == categoryName)
                .ToListAsync();

            return Ok(expenses);
        }
    }

    public class CategoryUpdateRequest
    {
        public decimal NewLimit { get; set; }
    }
}
