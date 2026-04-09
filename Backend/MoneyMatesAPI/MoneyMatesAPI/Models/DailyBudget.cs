using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    /// <summary>
    /// Tracks daily spending budgets and goals per category for each user
    /// User sets total daily budget, then allocates to categories
    /// Can mark each category as Over/Under budget
    /// Resets daily at midnight (00:00)
    /// </summary>
    public class DailyBudget
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        /// <summary>
        /// Date in YYYY-MM-DD format (no time component)
        /// </summary>
        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = null!;

        /// <summary>
        /// Total budget for the entire day
        /// </summary>
        [Required]
        public decimal TotalDailyBudget { get; set; }

        /// <summary>
        /// Amount allocated to this specific category
        /// </summary>
        [Required]
        public decimal AllocatedAmount { get; set; }

        /// <summary>
        /// Actual spending in this category today (calculated from daily expenses)
        /// </summary>
        public decimal ActualSpending { get; set; } = 0;

        /// <summary>
        /// User notes or goals for this category
        /// </summary>
        [MaxLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// Status: On-Track, Over, Under
        /// User manually marks if they went over or under budget
        /// </summary>
        [MaxLength(20)]
        public string Status { get; set; } = "On-Track";

        /// <summary>
        /// Whether this is today's budget (true) or past (false)
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Timestamp when this was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Timestamp when this was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Calculate remaining budget for the category
        /// </summary>
        [NotMapped]
        public decimal RemainingBudget => AllocatedAmount - ActualSpending;

        /// <summary>
        /// Calculate budget usage percentage
        /// </summary>
        [NotMapped]
        public decimal UsagePercentage => AllocatedAmount > 0 ? (ActualSpending / AllocatedAmount) * 100 : 0;

        /// <summary>
        /// Determine if over budget
        /// </summary>
        [NotMapped]
        public bool IsOverBudget => ActualSpending > AllocatedAmount;
    }
}
