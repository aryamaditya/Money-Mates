using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    public class GroupExpenseSplit
    {
        public int Id { get; set; }

        [Required]
        public int GroupExpenseId { get; set; }

        [Required]
        public int UserIdOwes { get; set; } // User who owes money

        [Required]
        public decimal Amount { get; set; } // Amount this user owes

        [Required]
        public bool IsSettled { get; set; } = false;

        [Required]
        public bool IsConfirmed { get; set; } = false; // Member confirmed they saw/agree to this expense

        public string? SettlementImageBase64 { get; set; } // Optional: stores base64 encoded settlement proof image

        // Navigation properties
        [ForeignKey("GroupExpenseId")]
        public GroupExpense? GroupExpense { get; set; }

        [ForeignKey("UserIdOwes")]
        public User? UserOwes { get; set; }
    }
}
