# MoneyMates - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Structure](#frontend-structure)
5. [Backend Structure](#backend-structure)
6. [Database Models](#database-models)
7. [Key Features Explained](#key-features-explained)
8. [API Endpoints](#api-endpoints)
9. [Real-Time Communication](#real-time-communication)
10. [Setup & Running](#setup--running)

---

## Project Overview

**MoneyMates** is a full-stack web application for personal and group expense tracking. It allows users to:
- Track personal income and expenses
- Manage budgets with category-based limits
- Create groups and split expenses with friends
- Real-time group chat with file uploads
- Visualize spending patterns with interactive charts
- Upload bill photos for expense documentation

**Target Users:** Individuals and groups wanting collaborative expense management

---

## Architecture

### High-Level Architecture

```
Frontend (React)
    ↓
    ↓ HTTP REST API + WebSocket
    ↓
Backend API (ASP.NET Core)
    ↓
    ↓ Entity Framework Core
    ↓
Database (SQL Server)
```

### Key Design Patterns
- **Service-Based Architecture**: Business logic separated into service layers
- **Component-Based UI**: Reusable React components with CSS Modules
- **SignalR Hub Pattern**: Real-time bidirectional communication for group chat
- **Async/Await**: All API calls are asynchronous

---

## Technology Stack

### Frontend
- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization (charts, graphs)
- **react-icons** - Icon library
- **CSS Modules** - Component-scoped styling
- **@microsoft/signalr** - Real-time WebSocket communication
- **Fetch API** - HTTP requests to backend

### Backend
- **ASP.NET Core 8.0** - Web framework
- **Entity Framework Core** - ORM for database
- **SQL Server** - Relational database
- **SignalR** - Real-time communication hub
- **CORS** - Cross-Origin Resource Sharing enabled

### Development Tools
- **Node.js** - JavaScript runtime for frontend
- **npm** - Package manager
- **Visual Studio / VS Code** - IDE

---

## Frontend Structure
 
### Directory Layout
```
Frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx           # Main dashboard page
│   │   │   ├── Dashboard.module.css    # Dashboard styling (900+ lines)
│   │   │   ├── CategorySection.jsx     # Budget category management
│   │   │   ├── CategorySection.css     # Category styles
│   │   │   └── Sidebar.jsx             # Left navigation
│   │   ├── Group.jsx                   # Group listing & creation
│   │   ├── Group.css                   # Group styles
│   │   ├── GroupChat.jsx               # Real-time group chat
│   │   ├── GroupChat.css               # Chat styles
│   │   ├── InviteGroup.jsx             # Group invite page
│   │   └── ...
│   ├── pages/
│   │   ├── Login.jsx                   # Login page
│   │   ├── Signup.jsx                  # User registration
│   │   ├── Setup.jsx                   # Initial setup wizard
│   │   ├── Profile.jsx                 # User profile page
│   │   └── ...
│   ├── services/
│   │   ├── categoryService.js          # Category API calls
│   │   ├── expenseService.js           # Expense API calls
│   │   ├── incomeService.js            # Income API calls
│   │   ├── groupService.js             # Group management API
│   │   ├── groupChatService.js         # SignalR connection management
│   │   └── profileService.js           # Profile API calls
│   ├── App.js                          # Main app component with routing
│   └── index.js                        # React entry point
├── public/
└── package.json
```

### Key Frontend Components

#### **Dashboard.jsx** (Main Dashboard Page)
**Purpose:** Central hub showing financial overview
**What It Does:**
- Displays welcome message with date & days left in month
- Shows total balance, income, expenses, savings cards
- Renders monthly spending area chart
- Shows category breakdown
- Lists 3 most recent transactions with "View all" modal
- Add income form integrated in balance card

**How It Works:**
1. On mount, fetches user data from localStorage
2. Makes 5 parallel API calls to fetch:
   - Total balance & income/expenses
   - Monthly spending data
   - Category breakdown
   - Recent transactions
3. Renders charts using Recharts
4. Passes data to child components (CategorySection)
5. Refreshes transactions when expense added via callback

**Key State Variables:**
- `totals` - { totalBalance, totalIncome, totalExpenses, totalSavings }
- `recentTransactions` - Array of recent expense/income records
- `showBalance` - Toggle to hide/show balance amount
- `showAllTransactionsModal` - Toggle for transaction popup
- `showAddIncomeForm` - Toggle for income form visibility

#### **CategorySection.jsx** (Budget Management)
**Purpose:** Manage spending categories and add expenses
**What It Does:**
- Display all user's budget categories with progress bars
- Show spending used vs limit for each category
- Allow adding new categories with budget limits
- Add expenses to specific categories
- Upload bill photos with expenses
- Edit category budget limits
- Delete expenses
- Display budget overallocation warnings

**How It Works:**
1. Fetches categories on component mount
2. Maps category data with spending progress calculation
3. For each category:
   - Shows progress bar (used/limit)
   - Lists expenses in that category
   - Allows expense form submission
4. Calculates available balance dynamically
5. Calls parent's `onExpenseAdded()` callback to refresh transactions
6. Validates budget allocation (blocks adding category if overallocated)

**Key Features:**
- Bill photo upload with Base64 encoding
- Real-time progress visualization
- Expense deletion with confirmation
- Edit category limits inline
- Warnings for exceeded budgets
- Professional text-based UI (no emojis)

#### **GroupChat.jsx** (Real-Time Messaging)
**Purpose:** Enable real-time group communication
**What It Does:**
- Display messages in real-time using SignalR
- Send text messages and file uploads
- Show user presence (who's online)
- Display invite button with group link modal

**How It Works:**
1. Establishes WebSocket connection to SignalR hub
2. Joins SignalR group named by groupId
3. Listens for "ReceiveMessage" events from hub
4. On message send:
   - Calls ExpenseService to save to database
   - Broadcasts to all users in group via SignalR
5. Handles file uploads (bills) with Base64 encoding
6. Prevents duplicate messages with deduplication logic

**Key Features:**
- Real-time bidirectional communication
- Message persistence in database
- File upload support
- User online status
- Invite link sharing

#### **Group.jsx** (Group Management)
**Purpose:** Create groups and manage memberships
**What It Does:**
- Display user's groups
- Show available groups to join (non-member groups)
- Create new groups
- Join groups via invite links

**How It Works:**
1. Fetches user's groups from GET /api/group
2. Fetches available groups (filtered by userId) from GET /api/group/all/available/{userId}
3. Displays both lists side-by-side
4. On group creation:
   - POST to /api/group
   - Returns inviteLink in response
   - Shows success modal with invite link
5. On group join:
   - POST to /api/group/join/{groupId}
   - Adds user to group
   - Refreshes available groups list

**Security:** Backend filters groups so users can only see groups they're NOT members of

### Service Layer (API Communication)

Each service file handles specific API domain:

#### **categoryService.js**
- `getCategoriesWithLimits(userId)` - Fetch all categories with limits/spending
- `getCategoryUsage(userId)` - Get category breakdown data
- `getCategoryExpenses(userId, categoryName)` - Fetch expenses in category
- `addCategory(userId, categoryName, limit)` - Create new category
- `updateCategoryLimit(userId, categoryName, newLimit)` - Edit budget limit
- `deleteCategory(userId, categoryName)` - Remove category

#### **expenseService.js**
- `addExpense(userId, category, amount, billImage)` - Create expense with optional bill photo
- `deleteExpense(expenseId)` - Remove expense
- `getCategoryExpenses(userId, categoryName)` - Fetch expenses

#### **incomeService.js**
- `addIncome(userId, amount, source)` - Record income entry

#### **groupService.js**
- `getUserGroups(userId)` - Fetch user's groups
- `getAvailableGroups(userId)` - Fetch groups user can join
- `createGroup(userId, groupName, description)` - Create new group
- `joinGroup(userId, groupId)` - Add user to group

#### **groupChatService.js**
- `startConnection(groupId)` - Establish SignalR WebSocket
- `stopConnection()` - Close WebSocket
- `subscribeToMessages(callback)` - Listen for incoming messages
- `sendMessage(groupId, userId, message, fileUrl)` - Send message + broadcast
- `subscribeToUserPresence(callback)` - Track online users

---

## Backend Structure

### Directory Layout
```
Backend/
├── MoneyMatesAPI/
│   ├── Program.cs                  # Application startup & middleware
│   ├── appsettings.json            # Configuration (DB connection string)
│   ├── MoneyMatesAPI.csproj        # Project file & dependencies
│   ├── Controllers/
│   │   ├── UserController.cs       # User registration & login
│   │   ├── DashboardController.cs  # Dashboard data endpoints
│   │   ├── CategoryController.cs   # Category management endpoints
│   │   ├── ExpenseController.cs    # Expense CRUD operations
│   │   ├── IncomeController.cs     # Income endpoints
│   │   ├── GroupController.cs      # Group management endpoints
│   │   ├── GroupMessageController  # Message CRUD endpoints
│   │   └── WeatherForecastController.cs
│   ├── Hubs/
│   │   └── GroupChatHub.cs         # SignalR hub for real-time chat
│   ├── Models/
│   │   ├── User.cs                 # User entity (name, email, password)
│   │   ├── Expense.cs              # Expense entity
│   │   ├── Income.cs               # Income entity
│   │   ├── Budget.cs               # Budget/Category entity
│   │   ├── Group.cs                # Group entity
│   │   ├── GroupMember.cs          # Group membership join table
│   │   ├── GroupMessage.cs         # Chat message entity
│   │   └── ...
│   ├── Data/
│   │   └── MoneyMatesDbContext.cs  # EF Core database context
│   └── Migrations/
│       └── [Migration files]       # Database schema versions
└── MoneyMatesAPI.sln               # Solution file
```

### Key Controllers

#### **DashboardController.cs**
**Purpose:** Provide dashboard statistics and overview data
**Endpoints:**
- `GET /api/dashboard/totals/{userId}` - Returns { totalBalance, totalIncome, totalExpenses, totalSavings }
- `GET /api/dashboard/spending/{userId}` - Returns monthly spending data for 12 months
- `GET /api/dashboard/categories/{userId}` - Returns category spending breakdown
- `GET /api/expenses/recent/{userId}` - Returns 10 most recent transactions

**Business Logic:**
- Calculates totals from Expense and Income tables
- Groups expenses by month for spending chart
- Sums spending by category
- Orders transactions by date (newest first)

#### **CategoryController.cs**
**Purpose:** Manage budget categories and spending limits
**Endpoints:**
- `GET /api/categories/{userId}` - Fetch all categories with limits
- `POST /api/categories` - Create new category
- `PUT /api/categories/{categoryId}` - Update category limit
- `DELETE /api/categories/{categoryId}` - Delete category

**Business Logic:**
- Validates category name uniqueness per user
- Calculates total spent in category
- Checks budget allocation (sum of limits ≤ total balance)
- Prevents deletion if category has expenses

#### **ExpenseController.cs**
**Purpose:** Handle expense CRUD operations
**Endpoints:**
- `POST /api/expenses` - Create expense (with optional bill image)
- `GET /api/expenses/{userId}` - Fetch all expenses
- `DELETE /api/expenses/{expenseId}` - Delete expense
- `GET /api/categories/{userId}/{categoryName}/expenses` - Expenses in category

**Business Logic:**
- Saves expense with category assignment
- Stores bill photo as Base64 string in database
- Updates category spending totals
- Validates amount > 0

#### **GroupController.cs**
**Purpose:** Manage groups and memberships
**Endpoints:**
- `GET /api/group/all/{userId}` - User's groups
- `GET /api/group/all/available/{userId}` - Groups user can join (filters out member groups)
- `POST /api/group` - Create new group (returns inviteLink)
- `POST /api/group/join/{groupId}` - Join group
- `DELETE /api/group/{groupId}` - Delete group

**Business Logic:**
- Generates random invite link on group creation
- Filters groups using `Where(g => !g.Members.Any(m => m.UserId == userId))`
- Checks user is not already member before joining
- Prevents join via invalid/expired links

**Security Features:**
- Groups only visible to non-members (prevents viewing all groups)
- User must exist to create/join groups
- Invite links are generated randomly

#### **GroupChatHub.cs** (SignalR Hub)
**Purpose:** Enable real-time bidirectional messaging
**Events:**
- `SendMessage(groupId, userId, message, fileUrl)` - Broadcast to group
- `ReceiveMessage(sender, message, timestamp, fileUrl)` - Receive message
- `JoinGroup(groupId)` - User joins hub group
- `UserOnline(userId)` - User presence notification

**How It Works:**
1. User connects to hub via WebSocket
2. Calls `JoinGroup(groupId)` to subscribe to group broadcasts
3. Calls `SendMessage()` to send message to group
4. SignalR broadcasts to all users in that group via `ReceiveMessage` event
5. Database persistence handled by GroupMessageController

---

## Database Models

### User
```
- UserId (PK)
- Name
- Email (unique)
- PasswordHash
- CreatedDate
- LastLoginDate
```

### Expense
```
- ExpenseId (PK)
- UserId (FK → User)
- Category (string)
- Amount (decimal)
- Description
- Date
- BillImage (Base64 string, nullable)
- CreatedDate
```

### Income
```
- IncomeId (PK)
- UserId (FK → User)
- Amount (decimal)
- Source (Salary, Freelance, Investment, etc.)
- Date
- CreatedDate
```

### Budget (Category)
```
- BudgetId (PK)
- UserId (FK → User)
- Category (string)
- LimitAmount (decimal)
- CreatedDate
```

### Group
```
- GroupId (PK)
- GroupName (string)
- Description
- CreatedByUserId (FK → User)
- InviteLink (string, unique)
- CreatedDate
- Members (collection of GroupMembers)
```

### GroupMember (Join Table)
```
- GroupMemberId (PK)
- GroupId (FK → Group)
- UserId (FK → User)
- JoinedDate
```

### GroupMessage
```
- MessageId (PK)
- GroupId (FK → Group)
- UserId (FK → User)
- SenderName (string)
- MessageText (string)
- FileUrl (Base64, nullable)
- Timestamp
```

---

## Key Features Explained

### 1. Personal Expense Tracking

**Flow:**
1. User adds expense in CategorySection
2. Expense saved to database with category, amount, date
3. Dashboard automatically fetches and displays recent transactions
4. Bill photo optionally attached (stored as Base64)
5. Progress bars update in real-time

**Why This Design:**
- Category structure allows budget allocation
- Bill photos provide proof of spending
- Real-time UI updates improve UX
- Base64 encoding avoids separate file storage

### 2. Budget Management

**Flow:**
1. User creates category with limit (e.g., "Food" - Rs. 5000)
2. System calculates: Available = TotalBalance - Sum(all category limits)
3. User can only add expense if category has limit
4. Warning shown if category limit exceeded
5. Entire "Add Category" form disabled if overallocated budget

**Validations:**
- Category limit ≤ remaining available balance
- Category names unique per user
- Cannot delete category with active expenses
- Real-time validation on category creation

### 3. Group Chat with Real-Time Messaging

**Technology:** WebSocket via SignalR

**Flow:**
1. User navigates to group chat
2. Frontend establishes WebSocket connection to SignalR hub
3. Joins SignalR group (named by groupId)
4. Types message and sends
5. Message sent to hub, persisted to database
6. Hub broadcasts to all connected users in group
7. All users receive message in real-time (no refresh needed)

**Features:**
- File uploads (bill photos) included in messages
- User presence tracking (shows who's online)
- Message history loaded on page load
- Deduplication prevents duplicate displays

**Why SignalR Over HTTP:**
- Bidirectional communication (server can push to client)
- Persistent connection (lower latency)
- Group broadcasting (efficient multi-user messages)
- Automatic reconnection handling

### 4. Group Invite System

**Flow:**
1. User creates group
2. Backend generates random unique invite link
3. System displays link in modal
4. User shares link with others
5. Friends click link → navigate to /group/invite/{groupId}
6. InviteGroup.jsx shows group details
7. User clicks "Join" button
8. Backend adds user to GroupMembers table
9. User can now see group in their group list

**Security:**
- Invite links are random/unpredictable
- Links don't expire automatically (can be revoked by deleting group)
- User must exist to join
- Can't join if already member

### 5. Dashboard Analytics

**Displays:**
- **Balance Card:** Total balance, income, expenses, savings
- **Area Chart:** Monthly income vs expense trend (12 months)
- **Category Breakdown:** Pie chart of spending by category
- **Recent Transactions:** Last 3 transactions with "View all" modal
- **Meta Cards:** Current date and days left in month

**Data Flow:**
1. Dashboard fetches totals → calculates savings
2. Fetches monthly data → renders area chart
3. Fetches category breakdown → renders pie chart
4. Fetches recent transactions → displays in table
5. All data refreshes when expense/income added

### 6. User Authentication

**Flow:**
1. Signup: User creates account (email + password)
2. Backend hashes password, saves to database
3. User receives user object: { userID, name, email }
4. Frontend stores in localStorage
5. Login: User enters email + password
6. Backend validates, returns user object
7. All API calls include userId from localStorage

**Security Considerations:**
- Passwords hashed before storage
- No sensitive data in localStorage (only userID, name)
- Each API call validates userId ownership
- CORS configured to only allow frontend origin

---

## API Endpoints

### Authentication
```
POST /api/user/signup
  Body: { name, email, password }
  Response: { userID, name, email }

POST /api/user/login
  Body: { email, password }
  Response: { userID, name, email }
```

### Dashboard
```
GET /api/dashboard/totals/{userId}
  Response: { totalBalance, totalIncome, totalExpenses, totalSavings }

GET /api/dashboard/spending/{userId}
  Response: Array of { month, income, expense }

GET /api/dashboard/categories/{userId}
  Response: Array of { name, value }

GET /api/expenses/recent/{userId}
  Response: Array of Expenses (sorted by date, newest first)
```

### Categories
```
GET /api/categories/{userId}
  Response: Array of { Category, Used, Limit }

POST /api/categories
  Body: { userId, category, limitAmount }
  Response: { budgetId, category, limitAmount }

PUT /api/categories/{categoryId}
  Body: { limitAmount }
  Response: Success message

DELETE /api/categories/{categoryId}
  Response: Success message

GET /api/categories/{userId}/{categoryName}/expenses
  Response: Array of expenses in that category
```

### Expenses
```
POST /api/expenses
  Body: { userId, category, amount, description, billImage }
  Response: { expenseId, category, amount, ... }

GET /api/expenses/{userId}
  Response: Array of all expenses

GET /api/expenses/recent/{userId}
  Response: Array of 10 most recent expenses

DELETE /api/expenses/{expenseId}
  Response: Success message
```

### Income
```
POST /api/income
  Body: { userId, amount, source }
  Response: { incomeId, amount, source, date, ... }

GET /api/income/{userId}
  Response: Array of all income entries
```

### Groups
```
GET /api/group/all/{userId}
  Response: Array of user's groups with members

GET /api/group/all/available/{userId}
  Response: Array of groups user can join (excludes member groups)

POST /api/group
  Body: { userId, groupName, description }
  Response: { groupId, groupName, inviteLink, ... }

POST /api/group/join/{groupId}
  Body: { userId }
  Response: Success message

DELETE /api/group/{groupId}
  Response: Success message
```

### Group Messages
```
GET /api/groupmessages/{groupId}
  Response: Array of messages in group (sorted by timestamp)

POST /api/groupmessages
  Body: { groupId, userId, senderName, messageText, fileUrl }
  Response: { messageId, timestamp, ... }
```

---

## Real-Time Communication

### SignalR (WebSocket)

**Setup (Backend):**
1. Program.cs registers SignalR service
2. Hub configured at endpoint `/hubs/groupchat`
3. Allows CORS from frontend origin

**Setup (Frontend):**
1. groupChatService.js creates HubConnection
2. `.withUrl("http://localhost:5262/hubs/groupchat")`
3. Connects and joins group by groupId

**Message Flow:**
```
Frontend                        Backend Hub                    Other Clients
User types message
    ↓
Calls SendMessage() on hub
    ↓ (WebSocket)              Receives SendMessage event
                                    ↓
                               Saves to GroupMessages table
                                    ↓
                               Broadcasts to group
                               (InvokeAsync ReceiveMessage) → Receives ReceiveMessage
                                                                    ↓
                                                              Displays in chat
```

**Deduplication:**
- Frontend stores sent message locally immediately
- When hub broadcasts back, system checks if already exists
- Prevents duplicate messages in UI
- Uses message timestamp + sender as unique key

---

## Setup & Running

### Prerequisites
- Node.js 14+
- .NET 8 SDK
- SQL Server 2019+
- Visual Studio or VS Code

### Frontend Setup
```bash
cd Frontend
npm install
npm start
```
Runs on http://localhost:3000

### Backend Setup
```bash
cd Backend/MoneyMatesAPI
dotnet restore
dotnet build
dotnet run
```
Runs on http://localhost:5262

### Database
1. Update appsettings.json with SQL Server connection string
2. Run migrations:
   ```bash
   dotnet ef database update
   ```
3. Creates all tables: Users, Expenses, Income, Groups, GroupMessages, etc.

### Configuration
**Frontend (.env or hardcoded):**
```
REACT_APP_API_URL=http://localhost:5262
```

**Backend (appsettings.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=MoneyMatesDB;Trusted_Connection=true;"
  }
}
```

---

## File Organization Summary

| Layer | Files | Purpose |
|-------|-------|---------|
| **Frontend Components** | Dashboard.jsx, CategorySection.jsx, GroupChat.jsx | UI rendering & state management |
| **Frontend Services** | categoryService.js, expenseService.js, groupChatService.js | API communication |
| **Frontend Styling** | Dashboard.module.css, CategorySection.css | Component styling |
| **Backend Controllers** | DashboardController, CategoryController, GroupController | HTTP endpoints |
| **Backend Models** | User, Expense, Budget, Group | Database entities |
| **Backend Hub** | GroupChatHub.cs | Real-time WebSocket |
| **Database** | MoneyMatesDbContext.cs | EF Core context |

---

## Code Flow Examples

### Adding an Expense
1. User fills form in CategorySection.jsx
2. Clicks submit → `handleAddExpense()` called
3. Calls `expenseService.addExpense(userId, category, amount, billImage)`
4. Service makes POST to `/api/expenses`
5. Backend validates & saves to Expense table
6. Response returned to frontend
7. `fetchCategories()` refreshed to update progress bars
8. `onExpenseAdded()` callback invoked
9. Parent Dashboard calls `refreshTransactions()`
10. Recent transactions list updates automatically
11. Modal closes, form resets

### Sending Group Message
1. User types message in GroupChat.jsx
2. Clicks send → `handleSendMessage()` called
3. Calls `groupChatService.sendMessage(groupId, userId, message, fileUrl)`
4. Message sent via SignalR WebSocket to hub
5. Backend Hub receives → broadcasts to all users in group
6. Individual users receive via `ReceiveMessage` event
7. Frontend checks for duplicates
8. Message appended to chat display
9. Message also persisted via GroupMessageController
10. User sees message immediately in their chat window

---

## Key Takeaways

✅ **Complete Full-Stack Application** - Frontend displays, Backend processes, Database stores
✅ **Real-Time Features** - SignalR enables live chat without polling
✅ **Secure Design** - Passwords hashed, userId validation on every request
✅ **Responsive UI** - CSS Modules, CSS Grid/Flexbox for layouts
✅ **Scalable Architecture** - Service layer separates concerns
✅ **User-Centric Features** - Group sharing, bill photos, spending trends
✅ **Professional Design** - Modern gradients, animations, clean typography

---

## Common Questions

**Q: Why Base64 for bill images?**
A: No external storage (S3) needed, simpler deployment, included in database backup

**Q: How does SignalR prevent duplicate messages?**
A: Frontend stores sent message locally, hub broadcasts back, system deduplicates using timestamp + sender

**Q: How are groups secured?**
A: Backend filters using WHERE clause to exclude user's existing groups, preventing viewing all system groups

**Q: Why CSS Modules instead of Tailwind?**
A: Better component isolation, prevents style conflicts, easier customization per component

**Q: How is authentication handled?**
A: User object stored in localStorage, userId passed with every API request, backend validates ownership

---

*Documentation Generated: March 11, 2026*
*Last Updated: Final version with all features documented*
