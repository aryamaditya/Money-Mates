using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MoneyMatesAPI.Models
{
    public class GroupMessage
    {
        public int Id { get; set; }

        [Required]
        public int GroupId { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        public string Content { get; set; } = null!;

        public string? FileUrl { get; set; }

        public string? FileType { get; set; } // "text", "image", "audio"

        [Required]
        public DateTime SentAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("GroupId")]
        public Group? Group { get; set; }

        [ForeignKey("SenderId")]
        public User? Sender { get; set; }
    }
}
