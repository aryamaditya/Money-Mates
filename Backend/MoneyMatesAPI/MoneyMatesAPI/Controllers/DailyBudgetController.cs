using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DailyBudgetController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;
        private readonly ILogger<DailyBudgetController> _logger;

        public DailyBudgetController(MoneyMatesDbContext context, ILogger<DailyBudgetController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/dailybudget/user/{userId}/today
        /// Get today's budget allocations for all categories
        /// </summary>
        [HttpGet("user/{userId}/today")]
        public async Task<IActionResult> GetTodaysBudgets(int userId)
        {
            try
            {
                var today = DateTime.Now.Date;
                var budgets = await _context.DailyBudgets
                    .Where(b => b.UserId == userId && b.Date.Date == today && b.IsActive)
                    .OrderBy(b => b.Category)
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {budgets.Count} budgets for user {userId} on {today}");
                return Ok(budgets);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving today's budgets: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving budgets" });
            }
        }

        /// <summary>
        /// GET /api/dailybudget/user/{userId}/summary/today
        /// Get today's budget summary: total allocated, total spent, remaining
        /// </summary>
        [HttpGet("user/{userId}/summary/today")]
        public async Task<IActionResult> GetTodaysSummary(int userId)
        {
            try
            {
                var today = DateTime.Now.Date;
                var budgets = await _context.DailyBudgets
                    .Where(b => b.UserId == userId && b.Date.Date == today && b.IsActive)
                    .ToListAsync();

                if (!budgets.Any())
                {
                    return Ok(new
                    {
                        totalDailyBudget = 0,
                        totalAllocated = 0,
                        totalActualSpending = 0,
                        remainingBudget = 0,
                        usagePercentage = 0,
                        isOverBudget = false,
                        budgetCount = 0
                    });
                }

                var totalDailyBudget = budgets.First().TotalDailyBudget;
                var totalAllocated = budgets.Sum(b => b.AllocatedAmount);
                var totalActual = budgets.Sum(b => b.ActualSpending);

                return Ok(new
                {
                    totalDailyBudget,
                    totalAllocated,
                    totalActualSpending = totalActual,
                    remainingBudget = totalAllocated - totalActual,
                    usagePercentage = totalAllocated > 0 ? (totalActual / totalAllocated) * 100 : 0,
                    isOverBudget = totalActual > totalAllocated,
                    budgetCount = budgets.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving today's summary: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving summary" });
            }
        }

        /// <summary>
        /// POST /api/dailybudget/create-or-update
        /// Create or update a daily budget for a category
        /// </summary>
        [HttpPost("create-or-update")]
        public async Task<IActionResult> CreateOrUpdateBudget([FromBody] CreateDailyBudgetRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (request.TotalDailyBudget <= 0 || request.AllocatedAmount < 0)
                    return BadRequest(new { message = "Invalid budget amounts" });

                var today = DateTime.Now.Date;

                // Check if already exists
                var existing = await _context.DailyBudgets
                    .FirstOrDefaultAsync(b => 
                        b.UserId == request.UserId && 
                        b.Date.Date == today && 
                        b.Category == request.Category);

                if (existing != null)
                {
                    // Update
                    existing.TotalDailyBudget = request.TotalDailyBudget;
                    existing.AllocatedAmount = request.AllocatedAmount;
                    existing.ActualSpending = request.ActualSpending ?? existing.ActualSpending;
                    existing.Status = request.Status ?? existing.Status;
                    existing.Notes = request.Notes;
                    existing.UpdatedAt = DateTime.Now;
                    _context.DailyBudgets.Update(existing);
                }
                else
                {
                    // Create new
                    var budget = new DailyBudget
                    {
                        UserId = request.UserId,
                        Date = today,
                        Category = request.Category,
                        TotalDailyBudget = request.TotalDailyBudget,
                        AllocatedAmount = request.AllocatedAmount,
                        ActualSpending = request.ActualSpending ?? 0,
                        Status = request.Status ?? "On-Track",
                        Notes = request.Notes,
                        IsActive = true
                    };
                    _context.DailyBudgets.Add(budget);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Created/updated budget for user {request.UserId}, category {request.Category}");

                return Ok(new { message = "Budget saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating/updating budget: {ex.Message}");
                return StatusCode(500, new { message = "Error saving budget" });
            }
        }

        /// <summary>
        /// PUT /api/dailybudget/{budgetId}/status
        /// Update the status of a budget (Over/Under/On-Track)
        /// </summary>
        [HttpPut("{budgetId}/status")]
        public async Task<IActionResult> UpdateBudgetStatus(int budgetId, [FromBody] UpdateBudgetStatusRequest request)
        {
            try
            {
                var budget = await _context.DailyBudgets.FindAsync(budgetId);
                if (budget == null)
                    return NotFound(new { message = "Budget not found" });

                if (!new[] { "On-Track", "Over", "Under" }.Contains(request.Status))
                    return BadRequest(new { message = "Invalid status. Use: On-Track, Over, or Under" });

                budget.Status = request.Status;
                budget.UpdatedAt = DateTime.Now;
                _context.DailyBudgets.Update(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Updated budget {budgetId} status to {request.Status}");
                return Ok(new { message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating budget status: {ex.Message}");
                return StatusCode(500, new { message = "Error updating status" });
            }
        }

        /// <summary>
        /// DELETE /api/dailybudget/{budgetId}
        /// Delete a budget entry
        /// </summary>
        [HttpDelete("{budgetId}")]
        public async Task<IActionResult> DeleteBudget(int budgetId)
        {
            try
            {
                var budget = await _context.DailyBudgets.FindAsync(budgetId);
                if (budget == null)
                    return NotFound(new { message = "Budget not found" });

                _context.DailyBudgets.Remove(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Deleted budget {budgetId}");
                return Ok(new { message = "Budget deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting budget: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting budget" });
            }
        }

        /// <summary>
        /// GET /api/dailybudget/user/{userId}/history/{days}
        /// Get past budgets for the last N days (default 30)
        /// </summary>
        [HttpGet("user/{userId}/history/{days}")]
        public async Task<IActionResult> GetBudgetHistory(int userId, int days = 30)
        {
            try
            {
                if (days <= 0) days = 30;
                if (days > 365) days = 365;

                var startDate = DateTime.Now.Date.AddDays(-days);
                var endDate = DateTime.Now.Date;

                var history = await _context.DailyBudgets
                    .Where(b => b.UserId == userId && b.Date.Date >= startDate && b.Date.Date <= endDate)
                    .OrderByDescending(b => b.Date)
                    .ThenBy(b => b.Category)
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {history.Count} historical budgets for user {userId}");
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving budget history: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving history" });
            }
        }
    }

    /// <summary>
    /// Request model for creating/updating daily budget
    /// </summary>
    public class CreateDailyBudgetRequest
    {
        public int UserId { get; set; }
        public string Category { get; set; }
        public decimal TotalDailyBudget { get; set; }
        public decimal AllocatedAmount { get; set; }
        public decimal? ActualSpending { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Request model for updating budget status
    /// </summary>
    public class UpdateBudgetStatusRequest
    {
        public string Status { get; set; } // Over, Under, On-Track
    }
}
