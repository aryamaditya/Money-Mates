using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly MoneyMatesDbContext _context;

        public UsersController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // POST: api/users/signup
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] User user)
        {
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                return BadRequest(new { message = "Email already exists." });
            }

            // Ensure Id is not set manually
            user.Id = 0;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { userID = user.Id, name = user.Name, email = user.Email });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email == request.Email && u.Password == request.Password);

            if (user == null)
                return BadRequest(new { message = "Invalid email or password." });

            return Ok(new
            {
                userID = user.Id,
                name = user.Name,
                email = user.Email,
                isFirstLogin = user.IsFirstLogin  // <- new
            });
        }
        [HttpPost("complete-setup/{userId}")]
        public async Task<IActionResult> CompleteSetup(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            user.IsFirstLogin = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Setup completed successfully." });
        }

        // GET: api/users/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(new { id = user.Id, name = user.Name, email = user.Email });
        }

        // PUT: api/users/{userId}
        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Check if email is already taken by another user
            if (request.Email != user.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already in use." });

            user.Name = request.Name ?? user.Name;
            user.Email = request.Email ?? user.Email;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { id = user.Id, name = user.Name, email = user.Email, message = "Profile updated." });
        }

        // POST: api/users/{userId}/change-password
        [HttpPost("{userId}/change-password")]
        public async Task<IActionResult> ChangePassword(int userId, [FromBody] ChangePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Verify old password
            if (user.Password != request.OldPassword)
                return BadRequest(new { message = "Old password is incorrect." });

            // Update password
            user.Password = request.NewPassword;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

    }

    // DTO for login
    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    // DTO for updating profile
    public class UpdateProfileRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
    }

    // DTO for changing password
    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
