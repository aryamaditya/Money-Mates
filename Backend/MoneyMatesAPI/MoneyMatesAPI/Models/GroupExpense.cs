using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    public class GroupExpense
    {
        public int Id { get; set; }

        [Required]
        public int GroupId { get; set; }

        [Required]
        public int PaidByUserId { get; set; } // User who paid

        [Required]
        public string Description { get; set; } = null!;

        [Required]
        public decimal Amount { get; set; }

        public string? Category { get; set; }

        public string? BillImageBase64 { get; set; } // Optional: stores base64 encoded bill image

        [Required]
        public DateTime DateAdded { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("GroupId")]
        public Group? Group { get; set; }

        [ForeignKey("PaidByUserId")]
        public User? PaidBy { get; set; }

        public ICollection<GroupExpenseSplit>? Splits { get; set; }
    }
}
