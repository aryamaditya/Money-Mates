namespace MoneyMatesAPI.Models
{
    public class Budget
    {
        public int Id { get; set; }
        public int UserId { get; set; }  // FK to User
        public string Category { get; set; } = null!;
        public decimal Limit { get; set; }
    }
}
