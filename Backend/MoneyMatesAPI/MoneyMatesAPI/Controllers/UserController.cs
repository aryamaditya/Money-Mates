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
            // Validate input
            var validationErrors = ValidateSignup(user);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Check for duplicate email
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                return BadRequest(new { message = "Email already exists. Please use a different email." });
            }

            // Trim whitespace
            user.Name = user.Name.Trim();
            user.Email = user.Email.Trim();

            // Ensure Id is not set manually
            user.Id = 0;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { userID = user.Id, name = user.Name, email = user.Email });
        }

        /// <summary>
        /// Validate signup input
        /// </summary>
        private List<string> ValidateSignup(User user)
        {
            var errors = new List<string>();

            // Name validation
            if (string.IsNullOrWhiteSpace(user.Name))
                errors.Add("Name is required");
            else if (user.Name.Trim().Length < 2)
                errors.Add("Name must be at least 2 characters");
            else if (user.Name.Trim().Length > 50)
                errors.Add("Name cannot exceed 50 characters");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Name, @"^[a-zA-Z\s'-]+$"))
                errors.Add("Name can only contain letters, spaces, hyphens, and apostrophes");

            // Email validation
            if (string.IsNullOrWhiteSpace(user.Email))
                errors.Add("Email is required");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                errors.Add("Email format is invalid");
            else if (user.Email.Length > 100)
                errors.Add("Email is too long");

            // Password validation
            if (string.IsNullOrWhiteSpace(user.Password))
                errors.Add("Password is required");
            else if (user.Password.Length < 8)
                errors.Add("Password must be at least 8 characters");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[A-Z]"))
                errors.Add("Password must contain at least one uppercase letter");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[a-z]"))
                errors.Add("Password must contain at least one lowercase letter");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[0-9]"))
                errors.Add("Password must contain at least one number");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[!@#$%^&*]"))
                errors.Add("Password must contain at least one special character (!@#$%^&*)");

            return errors;
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
