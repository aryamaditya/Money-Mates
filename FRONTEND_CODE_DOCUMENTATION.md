# Frontend Code Documentation - Complete Comments & Function Explanations

## Overview
This document provides detailed explanations of all functions, components, and state management in the MoneyMates frontend application.

---

## 📁 Service Layer (API Communication)

### 1. **categoryService.js** - Budget Category Management
```javascript
// Contains all category-related API calls
// Location: src/services/categoryService.js
```

#### Functions:

**`getCategoryUsage(userId)`**
- **Purpose**: Fetch spending breakdown by category from Dashboard API
- **Returns**: Array of categories with spending data
- **Usage**: FALLBACK method when CategoryController is unavailable
- **Data**: { name, value/Name, Value }

**`getCategoryExpenses(userId, categoryName)`**
- **Purpose**: Get all expenses belonging to a specific budget category
- **Params**: 
  - `userId`: User ID
  - `categoryName`: e.g., "Food", "Transport"
- **Returns**: Array of expense objects
- **Each Expense**: { id, userId, category, amount, dateAdded, billImageBase64 }

**`getCategoriesWithLimits(userId)`**
- **Purpose**: Fetch all budget categories with their limits and spending
- **PRIMARY METHOD**: Tries this first, falls back to getCategoryUsage
- **Returns**: Array with { Category, Limit, Used }
- **Note**: Handles both PascalCase and camelCase responses

**`updateCategoryLimit(userId, categoryName, newLimit)`**
- **Purpose**: Update budget limit for existing category (used when overspent)
- **HTTP Method**: PUT
- **Returns**: Updated budget object with new limit

**`addCategory(userId, categoryName, limit)`**
- **Purpose**: Create new budget category with initial limit
- **Implementation**: Uses PUT method (idempotent)
- **Validation**: Limit cannot exceed totalBalance
- **Returns**: Created budget object

---

### 2. **expenseService.js** - Expense Management

#### Functions:

**`getUserExpenses(userId)`**
- **Purpose**: Fetch ALL expenses for a user
- **Returns**: Array of all expense objects
- **Each Expense**: { id, userId, category, amount, dateAdded, billImageBase64 }

**`getRecentExpenses(userId)`**
- **Purpose**: Fetch recent expenses (limited set) for dashboard display
- **Returns**: Array of recent expense objects
- **Used By**: Dashboard component to show transaction history

**`addExpense(userId, category, amount, billImageBase64 = null)`**
- **Purpose**: Create new expense entry with optional bill photo
- **Important**: Sends PascalCase properties to match ASP.NET backend
- **Payload Format**:
  ```javascript
  {
    UserId: parseInt(userId),
    Category: String(category),
    Amount: parseFloat(amount),
    BillImageBase64: billImageBase64  // null if no photo
  }
  ```
- **Features**:
  - Automatic data type conversion
  - Optional Base64 encoded bill image
  - Console logging for debugging
- **Returns**: Created expense object with ID

**`deleteExpense(expenseId)`**
- **Purpose**: Remove expense by ID
- **HTTP Method**: DELETE
- **Returns**: Deleted expense object or confirmation

---

### 3. **incomeService.js** - Income Management

#### Functions:

**`getUserIncome(userId)`**
- **Purpose**: Fetch ALL income entries for user
- **Returns**: Array of income objects
- **Each Income**: { id, userId, amount, source, dateAdded }

**`getTotalIncome(userId)`**
- **Purpose**: Get sum of all user income
- **Returns**: Total income as number
- **Used By**: Dashboard for displaying total income statistic

**`addIncome(userId, amount, source)`**
- **Purpose**: Create new income entry
- **Auto-Features**:
  - Automatically sets current date/time as entry date
  - Converts amount to proper number format
- **Returns**: Created income object with ID

**`deleteIncome(incomeId)`**
- **Purpose**: Remove income entry by ID
- **HTTP Method**: DELETE
- **Returns**: Deleted income object

---

## 🎨 Component Layer (React Components)

### 1. **CategorySection.jsx** - Core Budget Management Component
```javascript
// Main component for category management and expense tracking
// Location: src/components/dashboard/CategorySection.jsx
// Size: 702 lines
```

#### State Variables:

```javascript
// Category Management
const [categories, setCategories] = useState([]);           // All user categories
const [expandedCategory, setExpandedCategory] = useState(null); // Currently expanded
const [showAddForm, setShowAddForm] = useState(false);      // Show add category form

// Add Category Form
const [newCategoryName, setNewCategoryName] = useState("");     // Input: category name
const [newCategoryLimit, setNewCategoryLimit] = useState("");   // Input: budget limit
const [addingCategory, setAddingCategory] = useState(false);    // Loading state

// Edit Category Form
const [editingCategory, setEditingCategory] = useState(null);   // Category being edited
const [editLimit, setEditLimit] = useState("");                  // New limit input
const [updatingCategory, setUpdatingCategory] = useState(false); // Loading state

// Add Expense Form
const [addingExpenseCategory, setAddingExpenseCategory] = useState(null); // Which category form open
const [expenseAmount, setExpenseAmount] = useState("");      // Expense amount input
const [expenseDescription, setExpenseDescription] = useState(""); // Optional description
const [addingExpense, setAddingExpense] = useState(false);   // Loading state

// Delete Expense
const [deletingExpenseId, setDeletingExpenseId] = useState(null); // Expense being deleted

// Bill Image Upload
const [billImage, setBillImage] = useState(null);                // File object
const [billImagePreview, setBillImagePreview] = useState(null);  // Base64 preview
const [viewingBillImage, setViewingBillImage] = useState(null);  // Modal image viewer
```

#### Key Functions:

**`fetchCategories()`**
- **Purpose**: Load all user categories with fallback mechanism
- **Logic Flow**:
  1. Try CategoryController API endpoint
  2. If fails, fallback to Dashboard API
  3. Map responses to component format
  4. Handle both PascalCase and camelCase properties
- **Sets**: categories state
- **Called**: On component mount and after category changes

**`toggleCategory(categoryName)`**
- **Purpose**: Expand/collapse category to show expenses
- **Logic**:
  - If already expanded → collapse it
  - If not expanded → fetch expenses and expand
- **Lazy Loading**: Expenses only fetched when category first opened
- **Sets**: expandedCategory, categories (with expenses)

**`handleAddCategory(e)`**
- **Purpose**: Validate and create new budget category
- **Validations**:
  - Category name not empty
  - Limit > 0
  - Total limits ≤ totalBalance (ensures no over-allocation)
- **Sets**: Button to "Adding..." during submission
- **On Success**: Clears form, fetches updated categories

**`handleEditCategory(categoryName)`**
- **Purpose**: Open edit form for overspent category
- **Validation**: Only shows edit button when overspent (status === "exceeded")
- **Sets**: editingCategory, editLimit state

**`handleUpdateCategory(categoryName)`**
- **Purpose**: Increase budget limit when overspent
- **Action**: Calls updateCategoryLimit API
- **On Success**: 
  - Closes edit form
  - Refreshes category data
  - Shows updated limit

**`handleAddExpense(e, categoryName)`**
- **Purpose**: Create expense and update category totals
- **Important Actions**:
  1. Validates amount > 0
  2. Calls expenseService.addExpense with billImageBase64
  3. **AWAITS** fetchCategories() to ensure data is fresh
  4. Calls getCategoryExpenses() separately to get updated list
  5. Updates UI with new expense visible immediately
- **Sets**: Clears form, resets billImage state
- **Note**: Previous bug fix - ensures proper refresh timing

**`handleDeleteExpense(expenseId, categoryName)`**
- **Purpose**: Remove expense with confirmation
- **Logic**:
  1. Shows confirmation dialog: "Are you sure? This action cannot be undone."
  2. If confirmed, calls deleteExpense API
  3. Refreshes categories to update totals
  4. Shows "Deleting..." state while processing
- **Sets**: deletingExpenseId state
- **On Success**: Expense removed from UI, totals recalculated

**`handleImageUpload(e)`**
- **Purpose**: Convert selected image to Base64 and validate
- **Validations**:
  - File type: Only JPG/PNG allowed
  - File size: Max 5MB
  - Error messages shown if validation fails
- **Process**:
  1. FileReader reads image file
  2. Converts to Base64 string
  3. Sets preview for user to see before submission
  4. Data URL format: "data:image/png;base64,[string]"
- **Sets**: billImage, billImagePreview state

**`getStatus(category)`**
- **Purpose**: Determine spending status for color-coding
- **Returns**: "safe" | "warning" | "exceeded"
- **Logic**:
  - Safe: ≤ 80% spent (🟢)
  - Warning: 80-100% spent (🟡)
  - Exceeded: > 100% spent (🔴)
- **Used**: For progress bar colors and badges

**`getProgressPercentage(category)`**
- **Purpose**: Calculate spending percentage for progress bar
- **Formula**: (used / limit) * 100
- **Cap**: Returns 100 if over limit (visually fills bar)
- **Used**: Render progress bar width

---

### 2. **Dashboard.jsx** - Main Dashboard Component
```javascript
// Displays financial overview with charts and statistics
// Location: src/components/dashboard/Dashboard.jsx
// Size: 341 lines
```

#### Key Functions:

**`useEffect([userId])`**
- **Purpose**: Load all dashboard data when userId changes
- **Data Fetched**:
  1. Total income/expenses/balance (from Dashboard API)
  2. Monthly spending trends (for line chart)
  3. Category breakdown (for pie chart)
  4. Recent transactions (for transaction list)
- **Sets**: totals, spendingData, categoryData, recentTransactions

**`setTotals(data)`**
- **Purpose**: Store financial summary
- **Data**: { totalBalance, totalIncome, totalExpenses, totalSavings }
- **Used By**: StatCard components for display

**`setSpendingData(data)`**
- **Purpose**: Store monthly spending history
- **Format**: [{ month: "January", Income: 50000, Expense: 30000 }, ...]
- **Used By**: LineChart for visualization

**`setCategoryData(data)`**
- **Purpose**: Store category spending breakdown
- **Format**: [{ name: "Food", value: 5000 }, ...]
- **Used By**: PieChart for visualization

**`setRecentTransactions(data)`**
- **Purpose**: Store recent expense/income history
- **Used By**: Recent transactions list display

---

### 3. **StatCard.jsx** - Statistics Display Card
```javascript
// Simple presentational component
// Location: src/components/dashboard/StatCard.jsx
```

#### Props:

```javascript
{
  iconColor: string,   // Background color (e.g., '#f06292')
  title: string,       // Card title (e.g., 'Total Balance')
  amount: string,      // Amount to display (e.g., 'Rs 50,000')
  icon: string,        // Emoji icon (e.g., '💰')
}
```

#### Render:
- Displays icon with colored background
- Shows title and amount
- Used for: Total Balance, Total Income, Total Expenses, Total Savings

---

### 4. **Sidebar.jsx** - Navigation Sidebar
```javascript
// Left sidebar with app logo and navigation menu
// Location: src/components/dashboard/Sidebar.jsx
```

#### Features:

**App Branding**
- Displays "MoneyMates" logo at top

**Navigation Items**
- Dashboard (currently active, fully implemented)
- Daily Planner (future feature)
- Groups (future feature)
- AI Insights (future feature)
- Profile (future feature)
- Settings (future feature)

**`handleLogout()` Function**
- **Purpose**: Clear user session and redirect to login
- **Actions**:
  1. Remove 'user' from localStorage
  2. Navigate to login page ('/')
- **Triggers**: When user clicks "Log Out" button

---

## 🔄 Data Flow

### Adding Expense Flow:
```
User fills form
    ↓
handleAddExpense() validates amount > 0
    ↓
handleImageUpload() converts image to Base64 (if provided)
    ↓
expenseService.addExpense() sends {UserId, Category, Amount, BillImageBase64}
    ↓
Backend creates expense in database
    ↓
fetchCategories() AWAIT called to refresh data
    ↓
getCategoryExpenses() updates expense list
    ↓
UI updates with new expense visible
    ↓
Bill preview cleared, form reset
```

### Bill Photo Viewing Flow:
```
User sees 📷 icon on expense
    ↓
Click 📷 icon
    ↓
setViewingBillImage(billImageBase64)
    ↓
Modal overlay appears
    ↓
Image displays with close button (✕)
    ↓
Click ✕ or outside modal
    ↓
setViewingBillImage(null)
    ↓
Modal closes
```

### Delete Expense Flow:
```
User clicks 🗑️ Delete button
    ↓
Confirmation dialog: "Are you sure? This action cannot be undone."
    ↓
If confirmed:
    ↓
handleDeleteExpense() calls expenseService.deleteExpense()
    ↓
Backend deletes from database
    ↓
fetchCategories() refreshes all data
    ↓
Expense removed from UI, totals updated
```

---

## 🔧 Important Implementation Details

### Base64 Image Handling:
- **Conversion**: FileReader API converts image file to Base64 string
- **Validation**: Frontend checks JPG/PNG only, max 5MB
- **Format**: Data URL: `data:image/png;base64,[long-string]`
- **Storage**: Stored in database as NVARCHAR(MAX) text field
- **Display**: Can be directly used in `<img src={base64String} />`

### Fallback API Logic:
- **Primary**: CategoryController `/api/category/{userId}`
- **Fallback**: Dashboard API `/api/dashboard/categories/{userId}`
- **Benefit**: If main endpoint fails, app still works with dashboard data

### Property Name Conversion:
- **Frontend**: Uses camelCase (userId, categoryName, billImageBase64)
- **Backend**: Uses PascalCase (UserId, Category, Amount, BillImageBase64)
- **Services**: Convert automatically when building payloads
- **Response Mapping**: Handle both formats for flexibility

### State Management Pattern:
- **Loading States**: `adding*`, `updating*`, `deleting*` for UI feedback
- **Form States**: Keep inputs separate from displayed data
- **Cached Data**: Categories kept in state, expenses loaded on expand
- **Immediate Updates**: Reset forms immediately, refresh data happens in background

---

## 📊 Component Hierarchy

```
App.js
  └── Dashboard.jsx
      ├── Sidebar.jsx
      ├── StatCard.jsx (×4)
      │   ├── Total Balance
      │   ├── Total Income
      │   ├── Total Expenses
      │   └── Total Savings
      ├── LineChart (Recharts)
      ├── PieChart (Recharts)
      ├── RecentTransactions list
      └── CategorySection.jsx
          ├── Add Category Form
          ├── Category Card (expandable)
          │   ├── Progress Bar
          │   ├── Status Badge
          │   ├── Edit Button (when overspent)
          │   ├── Recent Expenses List
          │   │   └── Expense Item
          │   │       ├── Date
          │   │       ├── Amount
          │   │       ├── 📷 Button (with modal viewer)
          │   │       └── 🗑️ Delete Button
          │   └── Add Expense Form
          │       ├── Amount Input
          │       ├── Description Input
          │       ├── Photo Upload Input
          │       ├── Preview Image
          │       └── Submit Button
          └── Bill Image Viewer Modal
              ├── Image Display
              ├── Close Button (✕)
              └── Overlay Background
```

---

## ⚙️ API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/category/{userId}` | GET | Get categories with limits (Primary) |
| `/api/dashboard/categories/{userId}` | GET | Get category breakdown (Fallback) |
| `/api/category/{userId}/{categoryName}` | PUT | Create/Update category |
| `/api/category/{userId}/{categoryName}/expenses` | GET | Get expenses for category |
| `/api/expenses` | POST | Create new expense |
| `/api/expenses/{expenseId}` | DELETE | Delete expense |
| `/api/dashboard/totals/{userId}` | GET | Get financial totals |
| `/api/dashboard/spending/{userId}` | GET | Get monthly spending |
| `/api/expenses/recent/{userId}` | GET | Get recent expenses |
| `/api/income/{userId}` | GET | Get income entries |
| `/api/income/total/{userId}` | GET | Get total income |
| `/api/income` | POST | Create income entry |

---

## 🐛 Known Issues & Fixes

### Issue 1: Category not updating after expense added
- **Cause**: handleAddExpense() didn't await fetchCategories()
- **Fix**: Added await before setting UI state
- **Result**: UI updates with fresh data

### Issue 2: Overspend amount showing 0
- **Cause**: Calculation was Math.max(limit - used, 0) which returns 0 when exceeded
- **Fix**: Changed to direct formula: (used - limit)
- **Result**: Correct overspend amount displays

### Issue 3: API returns HTTP 500 for invalid column
- **Cause**: BillImageBase64 field added to model but not created in database
- **Fix**: Created column manually: ALTER TABLE Expenses ADD BillImageBase64 NVARCHAR(MAX) NULL
- **Result**: API calls work without errors

---

## 🎯 Future Enhancements

1. **Image Gallery View**: Modal showing all expense photos in grid
2. **Image Cropping**: Allow users to crop images before upload
3. **Image Compression**: Reduce file size before Base64 conversion
4. **Search & Filter**: Find expenses by category, date, amount
5. **Recurring Expenses**: Set up automatic monthly expenses
6. **Budget Alerts**: Notify when spending reaches 80%, 100%
7. **Export Reports**: Download expense history as PDF/CSV
8. **Mobile App**: React Native version

---

Generated: January 24, 2026
Version: 1.0
