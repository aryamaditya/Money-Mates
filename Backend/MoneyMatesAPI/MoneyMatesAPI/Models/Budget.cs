namespace MoneyMatesAPI.Models
{
    public class Budget
    {
        public int BudgetID { get; set; }
        public int UserID { get; set; }
        public string Category { get; set; }
        public decimal LimitAmount { get; set; }
        public string Month { get; set; }
    }
}
