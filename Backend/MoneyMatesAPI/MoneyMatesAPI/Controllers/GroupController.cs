using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public GroupController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Create a new group
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Group name is required" });

            var group = new Group
            {
                Name = request.Name,
                Description = request.Description,
                CreatedBy = request.CreatedBy,
                CreatedDate = DateTime.Now
            };

            _context.Groups.Add(group);
            await _context.SaveChangesAsync();

            // Add creator as a member
            var groupMember = new GroupMember
            {
                GroupId = group.Id,
                UserId = request.CreatedBy,
                JoinedDate = DateTime.Now
            };

            _context.GroupMembers.Add(groupMember);
            await _context.SaveChangesAsync();

            // Generate invite link
            var inviteLink = $"http://localhost:3000/group/invite/{group.Id}";

            return Ok(new 
            { 
                id = group.Id, 
                name = group.Name,
                inviteLink = inviteLink,
                message = "Group created successfully" 
            });
        }

        /// <summary>
        /// Get all groups for a user
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserGroups(int userId)
        {
            var groups = await _context.GroupMembers
                .Where(gm => gm.UserId == userId)
                .Include(gm => gm.Group)
                    .ThenInclude(g => g!.Creator)
                .Include(gm => gm.Group)
                    .ThenInclude(g => g!.Members)
                    .ThenInclude(m => m.User)
                .Select(gm => new
                {
                    id = gm.Group!.Id,
                    name = gm.Group.Name,
                    description = gm.Group.Description,
                    createdBy = gm.Group.Creator!.Name,
                    createdDate = gm.Group.CreatedDate,
                    joinedDate = gm.JoinedDate,
                    memberCount = gm.Group.Members!.Count(),
                    members = gm.Group.Members!.Select(m => new { id = m.User!.Id, name = m.User.Name })
                })
                .ToListAsync();

            return Ok(groups);
        }

        /// <summary>
        /// Get group details
        /// </summary>
        [HttpGet("{groupId}")]
        public async Task<IActionResult> GetGroup(int groupId)
        {
            var group = await _context.Groups
                .Where(g => g.Id == groupId)
                .Include(g => g.Creator)
                .Include(g => g.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync();

            if (group == null)
                return NotFound(new { message = "Group not found" });

            var groupDto = new
            {
                id = group.Id,
                name = group.Name,
                description = group.Description,
                createdBy = group.Creator!.Name,
                createdDate = group.CreatedDate,
                memberCount = group.Members!.Count(),
                members = group.Members!.Select(m => new
                {
                    userId = m.User!.Id,
                    name = m.User.Name,
                    joinedDate = m.JoinedDate
                })
            };

            return Ok(groupDto);
        }

        /// <summary>
        /// Join an existing group
        /// </summary>
        [HttpPost("join")]
        public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request)
        {
            var group = await _context.Groups.FindAsync(request.GroupId);
            if (group == null)
                return NotFound(new { message = "Group not found" });

            // Check if user is already a member
            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId);

            if (isMember)
                return BadRequest(new { message = "User is already a member of this group" });

            var groupMember = new GroupMember
            {
                GroupId = request.GroupId,
                UserId = request.UserId,
                JoinedDate = DateTime.Now
            };

            _context.GroupMembers.Add(groupMember);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Successfully joined the group" });
        }

        /// <summary>
        /// Get available groups for a user (groups they haven't joined yet)
        /// </summary>
        [HttpGet("all/available/{userId}")]
        public async Task<IActionResult> GetAvailableGroups(int userId)
        {
            // Get groups the user is NOT already a member of
            var groups = await _context.Groups
                .Where(g => !g.Members!.Any(m => m.UserId == userId))
                .Include(g => g.Creator)
                .Include(g => g.Members)
                .Select(g => new
                {
                    id = g.Id,
                    name = g.Name,
                    description = g.Description,
                    createdBy = g.Creator!.Name,
                    createdDate = g.CreatedDate,
                    memberCount = g.Members!.Count()
                })
                .ToListAsync();

            return Ok(groups);
        }
    }

    public class CreateGroupRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int CreatedBy { get; set; }
    }

    public class JoinGroupRequest
    {
        public int GroupId { get; set; }
        public int UserId { get; set; }
    }
}
