using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    public class GroupMember
    {
        public int Id { get; set; }

        [Required]
        public int GroupId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public DateTime JoinedDate { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("GroupId")]
        public Group? Group { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
