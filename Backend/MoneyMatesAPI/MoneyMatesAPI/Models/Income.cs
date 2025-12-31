namespace MoneyMatesAPI.Models
{
    public class Income
    {
            public int Id { get; set; }
            public int UserId { get; set; }
            public decimal Amount { get; set; }
            public string Source { get; set; } = null!;
            public DateTime DateAdded { get; set; } = DateTime.Now;
        
    }
}
