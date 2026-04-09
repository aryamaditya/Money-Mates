using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Controllers
{
    // ==========================================
    // USER CONTROLLER
    // ==========================================
    // This controller handles all user-related API endpoints:
    // - Signup (create new account)
    // - Login (authenticate user)
    // - Get profile
    // - Update profile
    // - Change password
    // All endpoints follow REST conventions (HTTP methods: GET, POST, PUT, etc.)
    // ==========================================

    // [Route("api/[controller]")] -> This generates route: /api/users
    // [ApiController] -> Tells ASP.NET this is an API controller (handles JSON)
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        // ========== DEPENDENCY INJECTION ==========
        // _context is the database connection object, injected by ASP.NET
        // Used to query and modify User data in SQL Server database
        private readonly MoneyMatesDbContext _context;

        // Constructor - receives _context from dependency injection container
        public UsersController(MoneyMatesDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // SIGNUP ENDPOINT
        // ==========================================
        // POST: /api/users/signup
        // Purpose: Create a new user account
        // Request Body: JSON object with name, email, password
        // Response: {userID, name, email} if successful, or error message
        // ==========================================

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] User user)
        {
            // Step 1: Validate the input data
            // ValidateSignup() checks all business rules for name, email, password
            // Returns a list of error messages if validation fails
            var validationErrors = ValidateSignup(user);
            
            // If any validation errors found, return 400 (Bad Request) response
            if (validationErrors.Any())
            {
                // Send back the validation errors so frontend can show them to user
                return BadRequest(new { errors = validationErrors });
            }

            // Step 2: Check if email already exists in database
            // This prevents duplicate email registrations (emails must be unique)
            // AnyAsync() queries database and returns true if any user has this email
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                // Email already registered - return error
                return BadRequest(new { message = "Email already exists. Please use a different email." });
            }

            // Step 3: Clean up the data
            // Remove leading/trailing whitespace from name and email
            // Examples: " John " → "John", " john@mail.com " → "john@mail.com"
            user.Name = user.Name.Trim();
            user.Email = user.Email.Trim();

            // Make sure the Id property is reset to 0
            // (Database will auto-generate the actual unique ID when we save)
            user.Id = 0;

            // Step 4: Add user to database context
            // This adds the user to the "change tracker" but doesn't save to database yet
            _context.Users.Add(user);
            
            // Step 5: Save changes to database
            // await means "wait for this async operation to complete before continuing"
            // This is where the SQL INSERT statement actually executes
            // After this line, the user has a database-generated ID
            await _context.SaveChangesAsync();

            // Step 6: Return success response
            // Return 200 (OK) with the newly created user's data
            // Frontend receives: {userID: 1, name: "John Doe", email: "john@mail.com"}
            return Ok(new { userID = user.Id, name = user.Name, email = user.Email });
        }

        // ==========================================
        // VALIDATE SIGNUP INPUT
        // ==========================================
        // Purpose: Check that all input data meets business requirements
        // This is "backend validation" - essential security layer
        // Why needed: Frontend validation can be bypassed, but backend cannot
        // Returns: List of error messages (empty if validation passes)
        // ==========================================

        private List<string> ValidateSignup(User user)
        {
            // Create empty list to store error messages
            var errors = new List<string>();

            // ========== NAME VALIDATION ==========
            // Check 1: Is name empty or whitespace?
            if (string.IsNullOrWhiteSpace(user.Name))
                errors.Add("Name is required");
            
            // Check 2: Is name at least 2 characters?
            else if (user.Name.Trim().Length < 2)
                errors.Add("Name must be at least 2 characters");
            
            // Check 3: Is name too long (over 50 characters)?
            else if (user.Name.Trim().Length > 50)
                errors.Add("Name cannot exceed 50 characters");
            
            // Check 4: Does name contain only valid characters?
            // Valid: letters (a-z, A-Z), spaces, hyphens (-), apostrophes (')
            // Invalid: numbers, special characters like !@#$%
            // Example invalid: "John123", "John@Doe"
            // Example valid: "John Doe", "Mary-Jane", "O'Connor"
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Name, @"^[a-zA-Z\s'-]+$"))
                errors.Add("Name can only contain letters, spaces, hyphens, and apostrophes");

            // ========== EMAIL VALIDATION ==========
            // Check 1: Is email empty or whitespace?
            if (string.IsNullOrWhiteSpace(user.Email))
                errors.Add("Email is required");
            
            // Check 2: Is email format valid?
            // Regex pattern: ^[^\s@]+@[^\s@]+\.[^\s@]+$
            // Meaning: something@ + something . + something
            // Examples that PASS: "john@example.com", "user.name@domain.co.uk"
            // Examples that FAIL: "invalidemail", "john@", "@example.com", "john@.com"
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                errors.Add("Email format is invalid");
            
            // Check 3: Is email too long?
            else if (user.Email.Length > 100)
                errors.Add("Email is too long");

            // ========== PASSWORD VALIDATION ==========
            // Check 1: Is password empty?
            if (string.IsNullOrWhiteSpace(user.Password))
                errors.Add("Password is required");
            
            // Check 2: Is password at least 8 characters?
            else if (user.Password.Length < 8)
                errors.Add("Password must be at least 8 characters");
            
            // Check 3: Does password contain at least one UPPERCASE letter?
            // [A-Z] means: any character from A to Z
            // Example: "password123!" fails, "Password123!" passes
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[A-Z]"))
                errors.Add("Password must contain at least one uppercase letter");
            
            // Check 4: Does password contain at least one lowercase letter?
            // [a-z] means: any character from a to z
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[a-z]"))
                errors.Add("Password must contain at least one lowercase letter");
            
            // Check 5: Does password contain at least one number?
            // [0-9] means: any digit (0, 1, 2, ..., 9)
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[0-9]"))
                errors.Add("Password must contain at least one number");
            
            // Check 6: Does password contain at least one special character?
            // [!@#$%^&*] means: one of these specific special characters
            // Other special characters (!,@,#,$,%,^,&,*) would also pass
            else if (!System.Text.RegularExpressions.Regex.IsMatch(user.Password, @"[!@#$%^&*]"))
                errors.Add("Password must contain at least one special character (!@#$%^&*)");

            // Return the list of errors
            // If list is empty, validation passed
            // If list has items, validation failed
            return errors;
        }

        // ==========================================
        // LOGIN ENDPOINT
        // ==========================================
        // POST: /api/users/login
        // Purpose: Authenticate user and return their details
        // Request Body: {email, password}
        // Response: {userID, name, email, isFirstLogin} if successful
        // ==========================================

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Query database to find user with matching email AND password
            // FindAsync searches Users table where both conditions are true
            // FirstOrDefaultAsync() returns first match, or null if not found
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email == request.Email && u.Password == request.Password);

            // If no matching user found, password or email is wrong
            if (user == null)
                return BadRequest(new { message = "Invalid email or password." });

            // User found! Return their details
            // isFirstLogin flag tells frontend whether to show onboarding/setup flow
            return Ok(new
            {
                userID = user.Id,
                name = user.Name,
                email = user.Email,
                isFirstLogin = user.IsFirstLogin
            });
        }

        // ==========================================
        // COMPLETE SETUP ENDPOINT
        // ==========================================
        // POST: /api/users/{userId}/complete-setup
        // Purpose: Mark that user has completed onboarding/setup
        // Sets IsFirstLogin flag to false
        // ==========================================

        [HttpPost("complete-setup/{userId}")]
        public async Task<IActionResult> CompleteSetup(int userId)
        {
            // Try to find user by ID in database
            var user = await _context.Users.FindAsync(userId);
            
            // If user not found, return 404 (Not Found)
            if (user == null) 
                return NotFound(new { message = "User not found." });

            // Mark that user has completed setup
            user.IsFirstLogin = false;
            
            // Save changes to database
            await _context.SaveChangesAsync();

            // Return success message
            return Ok(new { message = "Setup completed successfully." });
        }

        // ==========================================
        // GET PROFILE ENDPOINT
        // ==========================================
        // GET: /api/users/{userId}
        // Purpose: Retrieve user's profile information
        // Returns: {id, name, email}
        // ==========================================

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            // Try to find user by ID
            var user = await _context.Users.FindAsync(userId);
            
            // If user not found, return 404 (Not Found)
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Return user's profile data
            return Ok(new { id = user.Id, name = user.Name, email = user.Email });
        }

        // ==========================================
        // UPDATE PROFILE ENDPOINT
        // ==========================================
        // PUT: /api/users/{userId}
        // Purpose: Update user's profile (name, email)
        // Request Body: {name, email}
        // ==========================================

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileRequest request)
        {
            // Try to find user by ID
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Check if new email is already taken by another user
            // Only check if user is changing their email (not updating same email)
            if (request.Email != user.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email already in use." });

            // Update user's data (use ?? operator to keep old value if new value is null)
            user.Name = request.Name ?? user.Name;
            user.Email = request.Email ?? user.Email;

            // Save changes to database
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Return updated profile data
            return Ok(new { id = user.Id, name = user.Name, email = user.Email, message = "Profile updated." });
        }

        // ==========================================
        // CHANGE PASSWORD ENDPOINT
        // ==========================================
        // POST: /api/users/{userId}/change-password
        // Purpose: Allow user to change their password
        // Request Body: {oldPassword, newPassword}
        // ==========================================

        [HttpPost("{userId}/change-password")]
        public async Task<IActionResult> ChangePassword(int userId, [FromBody] ChangePasswordRequest request)
        {
            // Try to find user by ID
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Verify that old password matches current password in database
            if (user.Password != request.OldPassword)
                return BadRequest(new { message = "Old password is incorrect." });

            // Update password to new password
            user.Password = request.NewPassword;
            
            // Save changes to database
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Return success message
            return Ok(new { message = "Password changed successfully." });
        }
    }

    // ==========================================
    // DATA TRANSFER OBJECTS (DTOs)
    // ==========================================
    // DTOs are simple classes that represent request/response data
    // They define the structure of JSON data sent from frontend
    // ==========================================

    // DTO for login request
    // Frontend sends: {email, password}
    public class LoginRequest
    {
        public string Email { get; set; } = null!;      // User's email
        public string Password { get; set; } = null!;   // User's password
    }

    // DTO for updating profile
    // Frontend sends: {name, email}
    // Both fields are optional (nullable) - user can update just name, or just email, or both
    public class UpdateProfileRequest
    {
        public string? Name { get; set; }    // Optional name update
        public string? Email { get; set; }   // Optional email update
    }

    // DTO for changing password
    // Frontend sends: {oldPassword, newPassword}
    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = null!;    // Current password (for verification)
        public string NewPassword { get; set; } = null!;    // New password to set
    }
}
