namespace MoneyMatesAPI.Models
{
    public class Expense
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Category { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime DateAdded { get; set; } = DateTime.Now;
        public string? BillImageBase64 { get; set; } // Optional: stores image as base64 string
    }
}
