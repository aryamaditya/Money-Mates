using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;
using MoneyMatesAPI.Services;

namespace MoneyMatesAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupExpenseController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<GroupExpenseController> _logger;

        public GroupExpenseController(MoneyMatesDbContext context, IFileUploadService fileUploadService, ILogger<GroupExpenseController> logger)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        /// <summary>
        /// Add a new expense to a group (splits equally among all members)
        /// </summary>
        [HttpPost("add")]
        public async Task<IActionResult> AddGroupExpense([FromForm] AddGroupExpenseRequest request)
        {
            _logger.LogInformation($"=== AddGroupExpense START ===");
            _logger.LogInformation($"Request received - GroupId: {request.GroupId}, Description: {request.Description}, Amount: {request.Amount}");

            if (string.IsNullOrWhiteSpace(request.Description) || request.Amount <= 0)
                return BadRequest(new { message = "Invalid expense data" });

            // Check if group exists and user is a member
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == request.GroupId);

            if (group == null)
                return NotFound(new { message = "Group not found" });

            var isMember = group.Members!.Any(m => m.UserId == request.PaidByUserId);
            if (!isMember)
                return BadRequest(new { message = "User is not a member of this group" });

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

            // Create the group expense
            var expense = new GroupExpense
            {
                GroupId = request.GroupId,
                PaidByUserId = request.PaidByUserId,
                Description = request.Description,
                Amount = request.Amount,
                Category = request.Category,
                BillImageBase64 = billImagePath,
                DateAdded = DateTime.Now
            };

            _context.GroupExpenses.Add(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Expense created - Id: {expense.Id}, BillImagePath: {billImagePath}");

            // Create splits - either custom or equal
            var splits = new List<GroupExpenseSplit>();

            if (request.CustomSplits != null && request.CustomSplits.Count > 0)
            {
                // Custom splits provided
                foreach (var split in request.CustomSplits)
                {
                    if (split.Amount > 0)
                    {
                        splits.Add(new GroupExpenseSplit
                        {
                            GroupExpenseId = expense.Id,
                            UserIdOwes = split.UserId,
                            Amount = split.Amount,
                            IsSettled = false,
                            IsConfirmed = false
                        });
                    }
                }
            }
            else
            {
                // Default equal split among all members
                var splitAmount = request.Amount / group.Members!.Count;
                foreach (var member in group.Members!)
                {
                    splits.Add(new GroupExpenseSplit
                    {
                        GroupExpenseId = expense.Id,
                        UserIdOwes = member.UserId,
                        Amount = splitAmount,
                        IsSettled = false,
                        IsConfirmed = false
                    });
                }
            }

            _context.GroupExpenseSplits.AddRange(splits);
            await _context.SaveChangesAsync();

            var averageSplit = splits.Count > 0 ? splits.Average(s => s.Amount) : 0;

            return Ok(new
            {
                id = expense.Id,
                message = "Expense added successfully",
                expense = new
                {
                    expense.Id,
                    expense.GroupId,
                    expense.Description,
                    expense.Amount,
                    email = await _context.Users.Where(u => u.Id == request.PaidByUserId).Select(u => u.Email).FirstOrDefaultAsync(),
                    expense.DateAdded,
                    averageSplit,
                    billImageUrl = billImagePath != null ? $"http://localhost:5262/uploads/{billImagePath}" : null
                }
            });
        }

        /// <summary>
        /// Get all expenses for a group
        /// </summary>
        [HttpGet("group/{groupId}")]
        public async Task<IActionResult> GetGroupExpenses(int groupId)
        {
            var expenses = await _context.GroupExpenses
                .Where(e => e.GroupId == groupId)
                .Include(e => e.PaidBy)
                .Include(e => e.Splits)
                    .ThenInclude(s => s.UserOwes)
                .OrderByDescending(e => e.DateAdded)
                .Select(e => new
                {
                    e.Id,
                    e.GroupId,
                    e.Description,
                    e.Amount,
                    e.Category,
                    paidBy = e.PaidBy!.Name,
                    paidByEmail = e.PaidBy.Email,
                    paidByUserId = e.PaidBy.Id,
                    e.DateAdded,
                    billImageUrl = e.BillImageBase64 != null ? $"http://localhost:5262/uploads/{e.BillImageBase64}" : null,
                    allConfirmed = e.Splits!.All(s => s.IsConfirmed),
                    splits = e.Splits!.Select(s => new
                    {
                        s.Id,
                        s.Amount,
                        userOwes = s.UserOwes!.Name,
                        userOwesId = s.UserOwes.Id,
                        userOwesEmail = s.UserOwes.Email,
                        s.IsSettled,
                        s.IsConfirmed,
                        settlementImageUrl = s.SettlementImageBase64 != null ? $"http://localhost:5262/uploads/{s.SettlementImageBase64}" : null
                    })
                })
                .ToListAsync();

            return Ok(expenses);
        }

        /// <summary>
        /// Get expense summary for a group member
        /// </summary>
        [HttpGet("summary/{groupId}/{userId}")]
        public async Task<IActionResult> GetExpenseSummary(int groupId, int userId)
        {
            // Check if user is a member of the group
            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId);

            if (!isMember)
                return BadRequest(new { message = "User is not a member of this group" });

            // Get unsettled splits where user owes money
            var owesData = await _context.GroupExpenseSplits
                .Where(s => s.GroupExpense!.GroupId == groupId && 
                           s.UserIdOwes == userId && 
                           !s.IsSettled)
                .Include(s => s.GroupExpense)
                    .ThenInclude(e => e.PaidBy)
                .GroupBy(s => s.GroupExpense!.PaidByUserId)
                .Select(g => new
                {
                    creditorId = g.Key,
                    creditorName = g.FirstOrDefault()!.GroupExpense!.PaidBy!.Name,
                    creditorEmail = g.FirstOrDefault()!.GroupExpense!.PaidBy!.Email,
                    totalOwes = g.Sum(s => s.Amount)
                })
                .ToListAsync();

            // Get unsettled splits where others owe user money
            var owedData = await _context.GroupExpenseSplits
                .Where(s => s.GroupExpense!.GroupId == groupId && 
                           s.GroupExpense.PaidByUserId == userId && 
                           !s.IsSettled)
                .Include(s => s.UserOwes)
                .GroupBy(s => s.UserIdOwes)
                .Select(g => new
                {
                    debtorId = g.Key,
                    debtorName = g.FirstOrDefault()!.UserOwes!.Name,
                    debtorEmail = g.FirstOrDefault()!.UserOwes!.Email,
                    totalOwed = g.Sum(s => s.Amount)
                })
                .ToListAsync();

            return Ok(new
            {
                groupId,
                userId,
                youOwe = owesData,
                youAreOwed = owedData
            });
        }

        /// <summary>
        /// Confirm an expense (member acknowledges they saw/agree to the expense)
        /// </summary>
        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmExpense([FromBody] ConfirmExpenseRequest request)
        {
            var split = await _context.GroupExpenseSplits
                .Include(s => s.GroupExpense)
                    .ThenInclude(e => e.Splits)
                .FirstOrDefaultAsync(s => s.GroupExpenseId == request.ExpenseId && 
                                         s.UserIdOwes == request.UserId);

            if (split == null)
                return NotFound(new { message = "Split not found" });

            split.IsConfirmed = true;
            await _context.SaveChangesAsync();

            // Check if ALL members have confirmed - if so, auto-settle all splits
            var allSplits = split.GroupExpense!.Splits!;
            if (allSplits.All(s => s.IsConfirmed))
            {
                foreach (var s in allSplits)
                {
                    s.IsSettled = true;
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Expense confirmed and auto-settled by all members" });
            }

            return Ok(new { message = "Expense confirmed. Waiting for other members to confirm." });
        }

        /// <summary>
        /// Settle an expense (mark splits as settled)
        /// </summary>
        [HttpPost("settle")]
        public async Task<IActionResult> SettleExpense([FromForm] SettleExpenseRequest request)
        {
            var splits = await _context.GroupExpenseSplits
                .Where(s => s.GroupExpenseId == request.ExpenseId && 
                           s.UserIdOwes == request.UserIdOwes)
                .ToListAsync();

            if (!splits.Any())
                return NotFound(new { message = "Splits not found" });

            string? settlementImagePath = null;
            if (request.SettlementImage != null && request.SettlementImage.Length > 0)
            {
                try
                {
                    settlementImagePath = await _fileUploadService.SaveFileAsync(request.SettlementImage, "settlements");
                    _logger.LogInformation($"Settlement image saved: {settlementImagePath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error saving settlement image: {ex.Message}");
                    return BadRequest(new { message = "Failed to save settlement image" });
                }
            }

            foreach (var split in splits)
            {
                split.IsSettled = true;
                if (!string.IsNullOrEmpty(settlementImagePath))
                {
                    split.SettlementImageBase64 = settlementImagePath;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Expense settled successfully" });
        }

        /// <summary>
        /// Delete a group expense
        /// </summary>
        [HttpDelete("{expenseId}")]
        public async Task<IActionResult> DeleteGroupExpense(int expenseId)
        {
            var expense = await _context.GroupExpenses
                .Include(e => e.Splits)
                .FirstOrDefaultAsync(e => e.Id == expenseId);

            if (expense == null)
                return NotFound(new { message = "Expense not found" });

            // Delete bill image if exists
            if (!string.IsNullOrEmpty(expense.BillImageBase64))
            {
                _fileUploadService.DeleteFile(expense.BillImageBase64);
            }

            // Delete settlement images
            if (expense.Splits != null)
            {
                foreach (var split in expense.Splits)
                {
                    if (!string.IsNullOrEmpty(split.SettlementImageBase64))
                    {
                        _fileUploadService.DeleteFile(split.SettlementImageBase64);
                    }
                }
            }

            // Remove all associated splits
            _context.GroupExpenseSplits.RemoveRange(expense.Splits!);

            // Remove the expense
            _context.GroupExpenses.Remove(expense);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Expense deleted successfully" });
        }

        /// <summary>
        /// Diagnostic endpoint to verify files are being saved to disk
        /// </summary>
        [HttpGet("diagnostic/files")]
        public IActionResult CheckSavedFiles()
        {
            string uploadsPath = @"D:\College Work\FYP\MoneyMates\GroupUploads";
            
            try
            {
                if (!Directory.Exists(uploadsPath))
                {
                    return Ok(new { 
                        status = "error",
                        message = $"GroupUploads directory does not exist at {uploadsPath}"
                    });
                }

                var billsPath = Path.Combine(uploadsPath, "bills");
                var billFiles = new List<dynamic>();
                if (Directory.Exists(billsPath))
                {
                    billFiles = Directory.GetFiles(billsPath, "*.*", SearchOption.TopDirectoryOnly)
                        .Select(f => new 
                        { 
                            name = Path.GetFileName(f),
                            size = new FileInfo(f).Length,
                            created = System.IO.File.GetCreationTime(f),
                            modified = System.IO.File.GetLastWriteTime(f)
                        })
                        .Cast<dynamic>()
                        .ToList();
                }

                var settlementFiles = new List<dynamic>();
                string settlementsPath = Path.Combine(uploadsPath, "settlements");
                if (Directory.Exists(settlementsPath))
                {
                    settlementFiles = Directory.GetFiles(settlementsPath, "*.*", SearchOption.TopDirectoryOnly)
                        .Select(f => new
                        {
                            name = Path.GetFileName(f),
                            size = new FileInfo(f).Length,
                            created = System.IO.File.GetCreationTime(f),
                            modified = System.IO.File.GetLastWriteTime(f)
                        })
                        .Cast<dynamic>()
                        .ToList();
                }

                return Ok(new
                {
                    status = "success",
                    uploadsPath = uploadsPath,
                    billsDirectory = billsPath,
                    billFilesCount = billFiles.Count,
                    billFiles = billFiles,
                    settlementFilesCount = settlementFiles.Count,
                    settlementFiles = settlementFiles,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    status = "error",
                    message = ex.Message,
                    uploadsPath = uploadsPath
                });
            }
        }
    }

    public class AddGroupExpenseRequest
    {
        public int GroupId { get; set; }
        public int PaidByUserId { get; set; }
        public string Description { get; set; } = null!;
        public decimal Amount { get; set; }
        public string? Category { get; set; }
        public IFormFile? BillImage { get; set; }
        public List<CustomSplit>? CustomSplits { get; set; }
    }

    public class CustomSplit
    {
        public int UserId { get; set; }
        public decimal Amount { get; set; }
    }

    public class ConfirmExpenseRequest
    {
        public int ExpenseId { get; set; }
        public int UserId { get; set; }
    }

    public class SettleExpenseRequest
    {
        public int ExpenseId { get; set; }
        public int UserIdOwes { get; set; }
        public IFormFile? SettlementImage { get; set; }
    }
}
