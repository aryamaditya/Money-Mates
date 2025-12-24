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

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email == request.Email && u.Password == request.Password);

            if (user == null)
                return BadRequest(new { message = "Invalid email or password." });

            return Ok(new { userID = user.Id, name = user.Name, email = user.Email });
        }
    }

    // DTO for login
    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
