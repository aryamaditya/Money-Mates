using Microsoft.AspNetCore.Http;

namespace MoneyMatesAPI.Models
{
    public class AddExpenseRequest
    {
        public int UserId { get; set; }
        public string Category { get; set; } = null!;
        public decimal Amount { get; set; }
        public IFormFile? BillImage { get; set; }
    }
}
