# MoneyMates FYP Defense - StudyGuide & Quick Reference
## Signup Feature Focus

---

## ⚡ QUICK START - READ THIS FIRST

### What is MoneyMates?
A web application that helps groups track shared expenses and manage budgets together. Built with React frontend and .NET backend.

### Architecture in One Sentence:
**React (Frontend)** ←→ **HTTP/REST API** ←→ **.NET Web API (Backend)** ←→ **SQL Server Database**

### Signup in One Sentence:
**User fills form** → **Frontend validates** → **Sends to backend** → **Backend validates** → **Saves to database** → **Returns success/error**

---

## 📋 CORE DOCUMENTS YOU CREATED

1. **SIGNUP_DETAILED_EXPLANATION.md** - High-level overview of signup flow
2. **SIGNUP_FRONTEND_COMMENTED.jsx** - Fully commented React signup code
3. **SIGNUP_BACKEND_COMMENTED.cs** - Fully commented C# signup code
4. **DATABASE_MODEL_EXPLANATION.md** - Database structure and Entity Framework
5. **API_REQUEST_RESPONSE_EXPLANATION.md** - HTTP request/response examples
6. **COMPLETE_SYSTEM_OVERVIEW.md** - Architecture and talking points

---

## 🎯 TOP 10 VIVA QUESTIONS & ANSWERS

### Q1: "Explain the signup process step by step"

**Answer:**
1. User navigates to signup page
2. Sees form with 4 fields: Name, Email, Password, Confirm Password
3. Types values and form validates in real-time
4. Clicks "Create Account" button
5. Frontend runs final validation on all fields
6. If valid, sends JSON to `POST /api/users/signup`
7. Backend receives request, validates again
8. Backend checks if email already in database
9. If unique, saves new User record to SQL Server
10. Database auto-assigns ID
11. Backend returns 200 OK with userID
12. Frontend redirects to login page
13. **Success**: User account created!

**Key points to mention:**
- Real-time validation improves UX
- Backend validation ensures security
- Email uniqueness check prevents duplicates
- Async operations keep server responsive

---

### Q2: "Why validate on both frontend and backend?"

**Answer:**
**Frontend (Real-time):**
- Improves user experience (immediate feedback)
- Catches typos and honest mistakes
- Reduces unnecessary API calls
- Runs in browser (no server cost)
- BUT: Can be bypassed (attacker using Postman)

**Backend (Security):**
- **Never trust the client**
- Defense in depth strategy
- Protects database integrity
- Catches malicious requests
- Required for security

**Example:** User turns off JavaScript, attacker sends invalid data directly via curl:
```bash
curl -X POST http://localhost:5262/api/users/signup \
-H "Content-Type: application/json" \
-d '{"name":"A","email":"bad","password":"weak"}'
```
Backend catches these errors and returns 400 Bad Request.

---

### Q3: "What HTTP status codes are used and why?"

**Answer:**

| Code | Meaning | When Used |
|------|---------|-----------|
| **200 OK** | Success | User created successfully |
| **400 Bad Request** | Client error | Invalid input, email exists, validation fails |
| **404 Not Found** | Not found | Other endpoints (signup always succeeds or fails with 400) |
| **500 Server Error** | Backend crash | Database down, unexpected error |

**Why REST uses these:**
- Standardized communication
- Frontend knows what to do based on status
- Easy debugging (see status in browser network tab)
- Follows HTTP standard

---

### Q4: "How does the password get stored securely?"

**Answer:**

**Current Implementation (NOT SECURE):**
```
Password stored as plaintext in database
Transmitted as plaintext over HTTP network
⚠️ MAJOR SECURITY ISSUE
```

**What Should Be Done (Production):**

1. **Use HTTPS** (encrypt in transit)
   - Browser to server: encrypted tunnel
   - Even if network sniffed, password looks like: `...encrypted garbage...`

2. **Hash Password** (encrypt at rest)
   - Use BCrypt, PBKDF2, or Argon2
   - One-way encryption: Password123! → $2a$10$N9qo8uLOickgx2...
   - During login: Compare hashed input with stored hash
   - If database compromised, attacker gets hashes (useless)

**Code example:**
```csharp
// Signup
user.Password = BCrypt.HashPassword(user.Password);
_context.Users.Add(user);
await _context.SaveChangesAsync();

// Login
if (BCrypt.Verify(loginPassword, user.Password))
{
    // ✓ Password matches
}
```

---

### Q5: "What happens if the database goes down?"

**Answer:**

**Sequence:**
1. User clicks signup button
2. Frontend sends request to backend
3. Backend tries: `await _context.SaveChangesAsync()`
4. Database unreachable → Exception thrown
5. Backend returns **500 Internal Server Error**
6. Frontend receives error
7. Shows user: "Backend not reachable" or similar message

**Code that handles this:**
```javascript
// Frontend
try {
  const response = await fetch(...);
  // Process response
} catch (err) {
  setError("Backend not reachable.");
  // User sees error message
}
```

**In production, you'd want:**
- Proper error logging (track what actually failed)
- User-friendly error messages
- Health checks (monitor database uptime)
- Alerts (notify admin when database is down)
- Retry logic (automatically try again)
- Disaster recovery plan

---

### Q6: "Explain the Entity Framework ORM"

**Answer:**

**What is ORM?**
ORM = Object-Relational Mapper
= Bridge between object-oriented C# code and relational SQL database

**Why use it?**
```csharp
// WITHOUT ORM (Raw SQL):
SqlCommand cmd = new SqlCommand(
    "INSERT INTO Users (Name, Email, Password, IsFirstLogin) VALUES (@n, @e, @p, 1)",
    connection);
cmd.Parameters.AddWithValue("@n", user.Name);
// Tedious, error-prone, risky

// WITH Entity Framework (Clean):
_context.Users.Add(user);
await _context.SaveChangesAsync();
// EF generates SQL for us!
```

**What EF does:**
1. Maps C# objects to database tables
2. Automatically generates SQL queries
3. Prevents SQL injection (automatic parameterization)
4. Async support (async/await for non-blocking operations)
5. Relationships (foreign keys easily managed)
6. Migrations (schema version control)

**In Signup:**
```csharp
_context.Users.Add(user);  // User object → DbContext
await _context.SaveChangesAsync();
// EF generates behind scenes:
// INSERT INTO Users (Name, Email, Password, IsFirstLogin) 
// VALUES ('John', 'john@ex.com', 'Pass123!', 1)
// Then database auto-generates ID
```

---

### Q7: "How does the API request/response work?"

**Answer:**

**Frontend sends REQUEST:**
```
POST /api/users/signup HTTP/1.1
Host: localhost:5262
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Backend processes:**
1. Controller receives JSON
2. Deserializes to User object
3. Validates all fields
4. Checks email uniqueness
5. Saves to database
6. Gets auto-generated ID from database

**Backend sends RESPONSE (Success):**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userID": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Backend sends RESPONSE (Error):**
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "message": "Email already exists. Please use a different email."
}
```

**Frontend handles:**
- If 200 → Redirect to login
- If 400 → Show error message to user
- If 500 → Show "Backend error"

---

### Q8: "What's the MVC pattern?"

**Answer:**

MVC = Model-View-Controller (separates application into 3 layers)

```
┌─────────────────────────┐
│  VIEW (Frontend React)  │ ← What user sees
│  - Input form           │
│  - Display data         │
│  - Handle clicks        │
└────────────┬────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────┐
│  CONTROLLER (UserController)    │ ← Handles requests
│  - Receive HTTP request         │
│  - Call business logic          │
│  - Return response              │
└────────────┬────────────────────┘
             │
             ↓
┌──────────────────────────┐
│ MODEL (User, Services)   │ ← Business logic
│ - Validation             │
│ - Database queries       │
│ - Business rules         │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  DATABASE (SQL Server)   │ ← Persistent storage
└──────────────────────────┘
```

**Signup in MVC:**
- **Model:** User class, ValidateSignup() function
- **Controller:** UserController.Signup() endpoint
- **View:** Signup.jsx React component

**Benefits:**
- Separation of concerns (each layer has one job)
- Easy to test (test each layer independently)
- Scalable (easy to change one layer)
- Maintainable (clear structure)

---

### Q9: "What is REST and why do we use it?"

**Answer:**

**REST = Representational State Transfer**
= Architectural style for designing web APIs

**REST Principles:**
1. **Resource-based URLs** (not action-based)
   ```
   ✓ POST   /api/users              (create user)
   ✓ GET    /api/users/1            (get user 1)
   ✓ PUT    /api/users/1            (update user 1)
   ✓ DELETE /api/users/1            (delete user 1)
   
   ✗ POST /api/users/createUser     (action-based - not REST)
   ✗ POST /api/users/deleteUser     (action-based - not REST)
   ```

2. **HTTP Methods** (not custom actions)
   - GET: Retrieve data (read-only)
   - POST: Create new resource
   - PUT: Update existing resource
   - DELETE: Delete resource

3. **HTTP Status Codes**
   - 200: Success
   - 400: Client error (bad input)
   - 500: Server error

4. **Stateless** (each request is independent)

**Why REST?**
- **Standard** (everyone knows how it works)
- **Simple** (uses existing HTTP standards)
- **Scalable** (stateless design)
- **Testable** (can test with Postman, curl, etc.)
- **Mobile-friendly** (works with any client)

---

### Q10: "What are the main tables in the database?"

**Answer:**

**Users Table** (Auth & Profile)
- Id (Primary Key, auto-increment)
- Name (User's name)
- Email (Unique, for login)
- Password (User's password)
- IsFirstLogin (true = first-time user)

```sql
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(MAX) NOT NULL,
    Email NVARCHAR(MAX) NOT NULL UNIQUE,
    Password NVARCHAR(MAX) NOT NULL,
    IsFirstLogin BIT NOT NULL DEFAULT(1)
);
```

**Other Main Tables:**
- **Expenses** (Individual expense tracking)
- **Budgets** (Budget management)
- **Groups** (Group management)
- **GroupMembers** (Who's in which group)
- **GroupExpenses** (Shared expenses within groups)

**Relationships:**
```
User (1) ──has many──> (many) Expenses
User (1) ──has many──> (many) Budgets
User (1) ──has many──> (many) Groups
Group (1) ──has many──> (many) GroupExpenses
GroupExpense (1) ──has many──> (many) GroupExpenseSplits
```

---

## 🔐 SECURITY POINTS TO MENTION

### What Are the Security Issues?

1. **Plaintext Passwords** ❌
   - Stored as-is in database
   - Fix: Use BCrypt hashing

2. **No HTTPS** ❌
   - Passwords sent over unencrypted HTTP
   - Fix: Use HTTPS in production

3. **No Rate Limiting** ❌
   - Attacker can brute force signup
   - Fix: Limit requests per IP

4. **No Email Verification** ❌
   - Anyone can signup with any email
   - Fix: Send verification email

### What Would You Improve?

For production, I would:
1. ✅ Hash passwords with BCrypt
2. ✅ Use HTTPS (port 443 with SSL/TLS)
3. ✅ Add rate limiting
4. ✅ Verify email before activation
5. ✅ Add CAPTCHA to prevent bots
6. ✅ Use parameterized queries (EF does this)
7. ✅ Add JWT tokens for authentication
8. ✅ Encrypt connection strings
9. ✅ Add logging and monitoring
10. ✅ Add CORS carefully (restrict to trusted origins)

---

## 📊 VALIDATION RULES

### Name Validation
```
✓ Required
✓ 2-50 characters
✓ Only: letters, spaces, hyphens (-), apostrophes (')
✗ Numbers, special characters not allowed
```

### Email Validation
```
✓ Required
✓ Valid format (something@something.something)
✓ Maximum 100 characters
✓ Must be unique (checked against database)
```

### Password Validation
```
✓ Required
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special character (!@#$%^&*)
```

### Example Strong Password:
`SecurePass123!` ✓ (8 chars, Upper, lower, number, special)

### Example Weak Passwords:
```
password    ✗ (no uppercase, number, special char)
Password    ✗ (no number, special char)
Pass1       ✗ (no special char)
Pass123!    ✗ (no uppercase... wait, this has uppercase P)
```

---

## 🧪 HOW TO TEST SIGNUP

### Test in Browser:
1. Open http://localhost:3000/signup
2. Type invalid data (short name, bad email, weak password)
3. See error messages appear in real-time
4. Try submitting (should be blocked)
5. Fix errors one by one
6. Submit valid form
7. Should redirect to login page

### Test with Postman:
```
POST http://localhost:5262/api/users/signup
Headers: Content-Type: application/json

Body:
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!"
}

Expected: 200 OK with userID
```

### Test Error Cases:
```
// Short password
{"name": "Test", "email": "test@ex.com", "password": "weak"}
→ 400 Bad Request

// Duplicate email
{"name": "Test2", "email": "test@example.com", "password": "Pass123!"}
→ 400 "Email already exists"

// Invalid email
{"name": "Test", "email": "bademail", "password": "Pass123!"}
→ 400 "Email format is invalid"
```

---

## 💡 CONCEPTUAL UNDERSTANDING

### Request/Response Cycle

```
User Action
     ↓
Browser sends HTTP request
     ↓
Server receives request
     ↓
Process and validate data
     ↓
Query/update database
     ↓
Server sends HTTP response
     ↓
Browser receives response
     ↓
Update UI
     ↓
User sees result
```

### Async Programming (Why It Matters)

```
WITHOUT async (blocking):
Request 1: User A signs up → blocks for 2 seconds
Request 2: User B tries to sign up → has to wait 2+ seconds
Result: Slow for User B

WITH async (non-blocking):
Request 1: User A signs up → starts, then waits (doesn't block)
Request 2: User B signs up → starts immediately
Result: Both users served quickly
```

### Database Uniqueness Constraint

```
First signup: john@example.com ✓
Second signup: jane@example.com ✓
Third signup: john@example.com ✗ (DATABASE ERROR)
Database prevents duplicate email
Backend catches error and returns 400
User sees message: "Email already exists"
```

---

## 🎯 VIVA SURVIVAL KIT

### If You Don't Know the Answer:

**Strategy 1:** Relate to what you know
```
Q: "How would you add password reset?"
A: "Similar to signup - user enters email, backend sends reset link
   via email, user clicks link, validates token, enters new password,
   backend hashes it, saves to database."
```

**Strategy 2:** Explain the general principle
```
Q: "How would you implement two-factor authentication?"
A: "It would be a security layer - after password validation,
   send OTP to email, user enters OTP, backend validates OTP,
   then allow login. Similar to confirmation in signup."
```

**Strategy 3:** Ask clarifying question
```
Q: "How would you optimize signup for 1 million users?"
A: "Could you clarify - is this about concurrent signups or
   total registered users? If concurrent, I'd use load balancing
   and database replication..."
```

### If Examiner Questions Your Code:

**Respond with:**
1. Acknowledge the point
2. Explain it's a design decision
3. Discuss trade-offs
4. Show you know how to improve it

Example:
```
Examiner: "Why aren't you hashing passwords?"

You: "Good point. Currently storing plaintext passwords, which
is a security vulnerability. In production, I would use BCrypt
to hash passwords before storing in database. This way even if
database is compromised, passwords are protected. The trade-off
is slightly slower login verification, but security is worth it."
```

---

## 📚 TERMS TO KNOW

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface (backend service) |
| **REST** | Representational State Transfer (API design style) |
| **HTTP** | HyperText Transfer Protocol (how frontend talks to backend) |
| **JSON** | JavaScript Object Notation (format of data sent via HTTP) |
| **ORM** | Object-Relational Mapper (Entity Framework) |
| **CRUD** | Create, Read, Update, Delete (basic database operations) |
| **Async** | Asynchronous (non-blocking operations) |
| **Hash** | One-way encryption (BCrypt) |
| **MVC** | Model-View-Controller (architecture pattern) |
| **CORS** | Cross-Origin Resource Sharing (allow frontend-backend) |
| **JWT** | JSON Web Token (authentication token) |
| **Regex** | Regular Expression (pattern matching) |
| **DTO** | Data Transfer Object (lightweight object for requests/responses) |
| **Dependency Injection** | Pattern where dependencies are provided (not created) |
| **Migration** | Version control for database schema (Entity Framework) |

---

## ✅ FINAL CHECKLIST

Before your viva, make sure you can:

- [ ] Explain signup from start to finish
- [ ] Draw the system architecture diagram
- [ ] Explain why both layers validate
- [ ] Describe the database schema
- [ ] Explain Entity Framework ORM
- [ ] Describe REST API principles
- [ ] Identify security issues
- [ ] Discuss how to improve security
- [ ] Explain HTTP status codes
- [ ] Describe async/await pattern
- [ ] Explain dependency injection
- [ ] Show request/response examples
- [ ] Explain MVC pattern
- [ ] Discuss scalability challenges
- [ ] Answer hypothetical questions about features

---

## 🎓 FINAL TIPS

1. **Know your code.**
   - You wrote it, you should know every line
   - Open files during viva if needed

2. **Understand, don't memorize.**
   - Focus on WHY, not just WHAT
   - Examiners ask follow-up questions

3. **Be honest about weaknesses.**
   - Say "I know this is a security issue" (shows awareness)
   - Explain how you'd fix it (shows learning)

4. **Use clear language.**
   - Avoid jargon when possible
   - Explain technical terms simply

5. **Draw diagrams.**
   - Sketch architecture on whiteboard
   - Visualize data flow
   - Shows you really understand it

6. **Think out loud.**
   - Don't stay silent when thinking
   - Explain your reasoning as you go

7. **Stay calm.**
   - You built this system
   - You know it better than anyone
   - They're asking to understand, not trick you

---

## 🚀 GOOD LUCK!

You have a solid full-stack application. Understand the concepts, know your code, and explain it clearly. You'll do great!

**Remember:** They're impressed you built a working system. Use the viva to show you understand HOW and WHY it works.

