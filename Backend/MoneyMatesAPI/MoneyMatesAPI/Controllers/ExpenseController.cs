using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;
using MoneyMatesAPI.Services;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExpensesController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<ExpensesController> _logger;

        public ExpensesController(MoneyMatesDbContext context, IFileUploadService fileUploadService, ILogger<ExpensesController> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _logger = logger;
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
            try
            {
                var expenses = await _context.Expenses
                    .Where(e => e.UserId == userId)
                    .OrderByDescending(e => e.DateAdded)
                    .ToListAsync();

                return Ok(expenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // POST: api/expenses
        [HttpPost]
        public async Task<IActionResult> AddExpense([FromForm] AddExpenseRequest request)
        {
            _logger.LogInformation($"=== AddExpense START ===");
            _logger.LogInformation($"Request - UserId: {request.UserId}, Category: {request.Category}, Amount: {request.Amount}, HasBill: {request.BillImage != null}");

            if (request == null)
                return BadRequest(new { message = "Invalid expense data." });

            if (request.UserId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            if (string.IsNullOrWhiteSpace(request.Category))
                return BadRequest(new { message = "Category is required." });

            if (request.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than 0." });

            try
            {
                // Handle file upload if provided
                string? billImagePath = null;
                if (request.BillImage != null && request.BillImage.Length > 0)
                {
                    try
                    {
                        billImagePath = await _fileUploadService.SaveFileAsync(request.BillImage, "bills");
                        _logger.LogInformation($"Bill image saved: {billImagePath}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error saving bill image: {ex.Message}");
                        return BadRequest(new { message = "Failed to save bill image" });
                    }
                }

                // Create the expense
                var expense = new Expense
                {
                    UserId = request.UserId,
                    Category = request.Category,
                    Amount = request.Amount,
                    DateAdded = DateTime.Now,
                    BillImageBase64 = billImagePath  // Store file path instead of base64
                };

                _context.Expenses.Add(expense);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Expense created - Id: {expense.Id}, BillImagePath: {billImagePath}");

                return Ok(new
                {
                    message = "Expense added successfully",
                    expense = new
                    {
                        expense.Id,
                        expense.UserId,
                        expense.Category,
                        expense.Amount,
                        expense.DateAdded,
                        billImageUrl = billImagePath != null ? $"http://localhost:5262/uploads/{billImagePath}" : null
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding expense: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
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
