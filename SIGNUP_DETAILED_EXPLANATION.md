# MoneyMates - Signup Flow Detailed Explanation
## For FYP Defense

---

## 1. HIGH-LEVEL SIGNUP FLOW

```
USER INTERACTION (Frontend)
         ↓
User fills form (Name, Email, Password, Confirm Password)
         ↓
FRONTEND VALIDATION
- Check name (2-50 chars, letters/hyphens/apostrophes only)
- Check email format
- Check password strength (8+ chars, uppercase, lowercase, number, special char)
- Check passwords match
         ↓
If validation fails → Show error messages on UI (No API call made)
If validation passes → Send POST request to backend
         ↓
BACKEND VALIDATION
- Validate input again (defense in depth)
- Check if email already exists in database
- If validation fails → Return error response
- If validation passes → Save user to database
         ↓
DATABASE OPERATION
- Insert new User record with Name, Email, Password, IsFirstLogin=true
- Database generates unique User ID
         ↓
BACKEND RESPONSE
- Return user details (ID, Name, Email) to frontend
         ↓
FRONTEND NAVIGATION
- Store user info (optional - depends on your app)
- Redirect user to Login page or Dashboard
         ↓
SUCCESS: User account created and ready to login
```

---

## 2. FRONTEND SIGNUP FLOW (React)

### File: `Frontend/src/pages/Signup.jsx`

**Key Concepts:**
- **State Management**: Uses React `useState` hook to manage form data
- **Real-time Validation**: Validates input as user types (improves UX)
- **Client-side Validation**: Ensures data quality before sending to backend
- **Error Display**: Shows specific validation messages to user
- **API Integration**: Communicates with backend via fetch API

### Signup Process:

1. **User loads Signup page**
   - Component renders with empty form fields
   - User sees input fields for: Name, Email, Password, Confirm Password

2. **User types in form**
   - Each `onChange` event triggers validation function
   - Validation errors are stored in state
   - UI shows red border on invalid fields
   - Error messages displayed below invalid fields

3. **User submits form**
   - `handleSignup` function is called
   - All fields are validated one final time
   - If any errors, form submission is blocked
   - If all valid, API call is made

4. **API Call Details**
   - **Endpoint**: `POST http://localhost:5262/api/users/signup`
   - **Request Body**: `{ name, email, password }`
   - **Headers**: `Content-Type: application/json`

5. **Response Handling**
   - **Success (200)**: Backend returns `{ userID, name, email }`
   - **Error (400)**: Backend returns `{ message }` or `{ errors }`
   - Frontend redirects to login page on success
   - Frontend displays error message on failure

---

## 3. BACKEND SIGNUP FLOW (.NET Web API)

### File: `Backend/MoneyMatesAPI/MoneyMatesAPI/Controllers/UserController.cs`

**Key Concepts:**
- **HTTP Endpoint**: Defines API route and HTTP method
- **Dependency Injection**: `MoneyMatesDbContext` injected automatically
- **Validation Layer**: Double-checks data (client validation can be bypassed)
- **Database Operation**: Uses Entity Framework Core ORM
- **Error Handling**: Returns appropriate HTTP status codes with messages

### Signup Endpoint (`POST /api/users/signup`):

1. **Receive Request**
   - Frontend sends JSON with name, email, password
   - ASP.NET deserializes JSON to User object

2. **Validate Input**
   - Function `ValidateSignup()` checks:
     - **Name**: Not empty, 2-50 chars, valid characters only
     - **Email**: Not empty, valid format, not too long
     - **Password**: Not empty, 8+ chars, uppercase, lowercase, number, special char
   - Returns list of all errors found
   - If errors exist, return 400 (Bad Request) with errors

3. **Check Email Uniqueness**
   - Query database: `_context.Users.AnyAsync(u => u.Email == user.Email)`
   - If email exists, return 400 with message "Email already exists"

4. **Prepare Data**
   - Trim whitespace from Name and Email
   - Ensure ID is not set (database will auto-generate)

5. **Save to Database**
   - Add user to DbContext: `_context.Users.Add(user)`
   - Save changes: `await _context.SaveChangesAsync()`
   - Database generates unique ID automatically

6. **Return Response**
   - Return 200 (OK) with user details
   - Response: `{ userID, name, email }`

---

## 4. DATABASE SCHEMA

### User Table
```sql
CREATE TABLE Users (
    Id              INT PRIMARY KEY IDENTITY(1,1),    -- Auto-incrementing unique ID
    Name            NVARCHAR(MAX) NOT NULL,            -- User's full name
    Email           NVARCHAR(MAX) NOT NULL UNIQUE,    -- Email (unique to prevent duplicates)
    Password        NVARCHAR(MAX) NOT NULL,            -- Password (stored as plaintext - NOT SECURE!)
    IsFirstLogin    BIT NOT NULL DEFAULT(1)            -- Flag for onboarding flow
);
```

### Data Flow:
1. Frontend sends: `{ name, email, password }`
2. Backend receives and validates
3. Backend inserts into Users table
4. Database auto-generates `Id`
5. Backend returns: `{ userID, name, email }`

---

## 5. VALIDATION RULES

### Name Validation
- ✓ Required (not empty)
- ✓ Minimum 2 characters
- ✓ Maximum 50 characters
- ✓ Only letters, spaces, hyphens (-), apostrophes (')
- ✗ Numbers and special characters not allowed

### Email Validation
- ✓ Required (not empty)
- ✓ Valid format (something@something.something)
- ✓ Maximum 100 characters
- ✓ Must be unique (checked against database)

### Password Validation
- ✓ Required (not empty)
- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special character (!@#$%^&*)

---

## 6. ERROR SCENARIOS

### Scenario 1: Invalid Name
```
Input: "ab"
Error: "Name must be at least 2 characters"
Status: 400 Bad Request

Input: "John123"
Error: "Name can only contain letters, spaces, hyphens, and apostrophes"
Status: 400 Bad Request
```

### Scenario 2: Invalid Email
```
Input: "invalidemail"
Error: "Email format is invalid"
Status: 400 Bad Request

Input: "john@example.com" (email already exists)
Error: "Email already exists. Please use a different email."
Status: 400 Bad Request
```

### Scenario 3: Weak Password
```
Input: "password"
Error: "Password must contain at least one uppercase letter"
Status: 400 Bad Request

Input: "Password1"
Error: "Password must contain at least one special character (!@#$%^&*)"
Status: 400 Bad Request
```

### Scenario 4: Passwords Don't Match
```
Input: password="Password1!", confirm="password1!"
Error: "Passwords do not match"
Status: Prevented on frontend (not sent to backend)
```

### Scenario 5: Success
```
Input: 
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}

Response (200 OK):
{
  "userID": 1,
  "name": "John Doe",
  "email": "john@example.com"
}

User account created, ready to login!
```

---

## 7. SECURITY CONSIDERATIONS

⚠️ **IMPORTANT - Current Implementation Issues:**

1. **Plaintext Passwords** ❌
   - Passwords are stored as plaintext in database
   - SECURITY RISK: If database is compromised, all passwords exposed
   - **Fix**: Use password hashing (e.g., BCrypt, PBKDF2)

2. **No Password Hashing**
   - Should hash password before storing in database
   - Backend should verify hashed password during login, not plaintext comparison

3. **No HTTPS/SSL**
   - Application runs on HTTP (not HTTPS)
   - Network traffic not encrypted
   - **Fix**: Use HTTPS in production

4. **Basic Validation**
   - Email validation is regex-based (not foolproof)
   - Could be improved with email confirmation

---

## 8. SIGNUP PROCESS SEQUENCE DIAGRAM

```
Frontend                           Backend                        Database
   |                                 |                               |
   |-- Form Loaded --|                                               |
   |                 ↓                                               |
   |-- User Types --|                                               |
   |-- Real-time Validation |                                       |
   |                                  |                               |
   |-- User Clicks "Create Account"| |                               |
   |-- Final Validation --| |                                        |
   |                                  |                               |
   |-- POST /api/users/signup |      |                               |
   |-- {"name", "email", "password"} →                              |
   |                                  |-- Validate Input --| |       |
   |                                  |-- Check Email Unique | → |  |
   |                                  |← yes, unique |               |
   |                                  |-- Prepare Data --| |         |
   |                                  |-- INSERT User | → |         |
   |                                  |← User inserted with ID |     |
   |                                  |                               |
   |← 200 OK ← {userID, name, email} |                               |
   |-- Store User Info --| |                                        |
   |-- Redirect to Login |                                          |
   |                                  |                               |
```

---

## 9. KEY POINTS FOR VIVA/DEFENSE

### Questions You Might Get Asked:

**Q: Why validate on both frontend and backend?**
A: Defense in depth. Frontend validation improves UX and catches honest mistakes. Backend validation secures against malicious requests (someone could bypass frontend validation using tools like Postman).

**Q: What happens if the same email registers twice simultaneously?**
A: Database constraint protects against this. First request saves successfully, second request fails because email already exists.

**Q: Why is IsFirstLogin field in User table?**
A: To track if user has completed onboarding/profile setup. Used to redirect first-time users to setup page.

**Q: How does the password get to backend securely?**
A: Currently sent over HTTP (NOT SECURE in production). Should use HTTPS to encrypt in transit.

**Q: What if password validation on backend fails?**
A: Returns 400 Bad Request with specific error messages telling frontend which rules weren't met.

---

## 10. NEXT STEPS AFTER SIGNUP

After successful signup:
1. User is created in database with `IsFirstLogin = true`
2. Backend returns userID
3. Frontend redirects to Login page
4. User logs in with email and password
5. If `IsFirstLogin` is true, user is guided through profile setup
6. User can then start using app features (track expenses, create budgets, etc.)

