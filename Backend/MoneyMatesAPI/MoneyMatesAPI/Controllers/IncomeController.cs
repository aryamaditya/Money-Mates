using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IncomeController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public IncomeController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // GET: api/income/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserIncome(int userId)
        {
            var incomes = await _context.Income
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.DateAdded)
                .ToListAsync();

            return Ok(incomes);
        }

        // GET: api/income/total/{userId}
        [HttpGet("total/{userId}")]
        public async Task<IActionResult> GetTotalIncome(int userId)
        {
            var totalIncome = await _context.Income
                .Where(i => i.UserId == userId)
                .SumAsync(i => i.Amount);

            return Ok(new { totalIncome });
        }

        // POST: api/income
        [HttpPost]
        public async Task<IActionResult> AddIncome([FromBody] Income income)
        {
            if (income == null)
                return BadRequest(new { message = "Invalid income data." });

            income.DateAdded = DateTime.Now;
            _context.Income.Add(income);
            await _context.SaveChangesAsync();

            return Ok(income);
        }

        // DELETE: api/income/{incomeId}
        [HttpDelete("{incomeId}")]
        public async Task<IActionResult> DeleteIncome(int incomeId)
        {
            var income = await _context.Income.FindAsync(incomeId);
            if (income == null)
                return NotFound(new { message = "Income record not found." });

            _context.Income.Remove(income);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Income deleted successfully." });
        }
    }
}
