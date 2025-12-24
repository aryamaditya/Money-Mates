namespace MoneyMatesAPI.Models
{
    public class Expense
    {
        public int ExpenseID { get; set; }
        public int UserID { get; set; }

        public string Category { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }
      
    }
}
