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
                CreatedDate = DateTime.Now,
                InviteCode = GenerateInviteCode() // Generate unique invite code
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
            var inviteLink = $"http://localhost:3000/group/invite/{group.InviteCode}";

            return Ok(new 
            { 
                id = group.Id, 
                name = group.Name,
                inviteCode = group.InviteCode,
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
                inviteCode = group.InviteCode,
                inviteLink = $"http://localhost:3000/group/invite/{group.InviteCode}",
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
            // Find group by invite code (not by group ID for security)
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.InviteCode == request.InviteCode);
            if (group == null)
                return NotFound(new { message = "Invalid invite code or group not found" });

            // Check if user is already a member
            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == group.Id && gm.UserId == request.UserId);

            if (isMember)
                return BadRequest(new { message = "User is already a member of this group" });

            var groupMember = new GroupMember
            {
                GroupId = group.Id,
                UserId = request.UserId,
                JoinedDate = DateTime.Now
            };

            _context.GroupMembers.Add(groupMember);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Successfully joined the group",
                groupId = group.Id,
                groupName = group.Name
            });
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

        /// <summary>
        /// Fix: Generate invite codes for groups without them (for existing groups in database)
        /// </summary>
        [HttpPost("fix-invite-codes")]
        public async Task<IActionResult> FixInviteCodes()
        {
            var groupsWithoutCodes = await _context.Groups
                .Where(g => string.IsNullOrEmpty(g.InviteCode))
                .ToListAsync();

            foreach (var group in groupsWithoutCodes)
            {
                group.InviteCode = GenerateInviteCode();
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Fixed {groupsWithoutCodes.Count} groups by generating invite codes",
                groupsUpdated = groupsWithoutCodes.Count
            });
        }

        /// <summary>
        /// Leave a group
        /// </summary>
        [HttpPost("leave")]
        public async Task<IActionResult> LeaveGroup([FromBody] LeaveGroupRequest request)
        {
            // Check if user is a member of the group
            var groupMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId);

            if (groupMember == null)
                return BadRequest(new { message = "You are not a member of this group" });

            // Remove the member from the group
            _context.GroupMembers.Remove(groupMember);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Successfully left the group" });
        }

        /// <summary>
        /// Helper method to generate unique invite code
        /// </summary>
        private string GenerateInviteCode()
        {
            // Generate a random 8-character code (alphanumeric)
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            var result = new char[8];
            for (int i = 0; i < result.Length; i++)
            {
                result[i] = chars[random.Next(chars.Length)];
            }
            return new string(result);
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
        public string InviteCode { get; set; } = null!;
        public int UserId { get; set; }
    }

    public class LeaveGroupRequest
    {
        public int GroupId { get; set; }
        public int UserId { get; set; }
    }
}
