using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    public class Group
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        public int CreatedBy { get; set; } // User ID of group creator

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation property
        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }

        public ICollection<GroupMember>? Members { get; set; }
    }
}
