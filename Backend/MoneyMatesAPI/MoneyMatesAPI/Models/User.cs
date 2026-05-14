using System.ComponentModel.DataAnnotations;

namespace MoneyMatesAPI.Models
{
    public class User
    {
        public int Id { get; set; } // Identity column

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;

        public bool IsFirstLogin { get; set; } = true;

        public bool IsSimulated { get; set; } = false;

        // User Profiling Fields for Peer Comparison
        public string? IncomeBracket { get; set; }
        public string? AgeGroup { get; set; }
        public string? HouseholdSize { get; set; }
    }
}
