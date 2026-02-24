using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupMessageController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;
        private readonly IWebHostEnvironment _env;

        public GroupMessageController(MoneyMatesDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Get all messages for a group
        /// </summary>
        [HttpGet("group/{groupId}")]
        public async Task<IActionResult> GetGroupMessages(int groupId)
        {
            try
            {
                var messages = await _context.GroupMessages
                    .Where(m => m.GroupId == groupId)
                    .Include(m => m.Sender)
                    .OrderBy(m => m.SentAt)
                    .Select(m => new
                    {
                        id = m.Id,
                        groupId = m.GroupId,
                        senderId = m.SenderId,
                        senderName = m.Sender!.Name,
                        content = m.Content,
                        fileUrl = m.FileUrl,
                        fileType = m.FileType,
                        sentAt = m.SentAt
                    })
                    .ToListAsync();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching messages: {ex.Message}" });
            }
        }

        /// <summary>
        /// Upload file and get URL
        /// </summary>
        [HttpPost("upload")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                // Validate file type
                var allowedImageTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                var allowedAudioTypes = new[] { "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm" };
                var isImage = allowedImageTypes.Contains(file.ContentType);
                var isAudio = allowedAudioTypes.Contains(file.ContentType);

                if (!isImage && !isAudio)
                    return BadRequest(new { message = "Only images and audio files are allowed" });

                // Create uploads directory
                var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
                Directory.CreateDirectory(uploadsDir);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"/uploads/{fileName}";
                var fileType = isImage ? "image" : "audio";

                return Ok(new { fileUrl, fileType });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error uploading file: {ex.Message}" });
            }
        }

        /// <summary>
        /// Delete a message
        /// </summary>
        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            try
            {
                var message = await _context.GroupMessages.FindAsync(messageId);
                if (message == null)
                    return NotFound(new { message = "Message not found" });

                _context.GroupMessages.Remove(message);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Message deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting message: {ex.Message}" });
            }
        }
    }
}
