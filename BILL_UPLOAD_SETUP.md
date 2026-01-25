# Bill Upload Feature - Quick Setup Guide

## ✅ What's Been Implemented

The bill upload feature is **95% complete**. Users can now:
- ✅ Upload JPG/PNG bill photos (Max 5MB)
- ✅ See live preview before submitting
- ✅ Remove/change image if needed
- ✅ Image stored in database as Base64
- ✅ See 📷 icon if expense has bill attached
- ✅ Full error handling and validation

---

## 🔧 Remaining Step: Database Migration

Since we added a new field to the Expense model, you need to update the database:

### In Backend Terminal:

```bash
# Navigate to backend project
cd Backend/MoneyMatesAPI/MoneyMatesAPI

# Create migration
dotnet ef migrations add AddBillImageToExpense

# Apply migration to database
dotnet ef database update
```

**What This Does:**
- Adds `BillImageBase64` column to Expenses table
- Type: `NVARCHAR(MAX)` (supports very long Base64 strings)
- Allows NULL values (image is optional)

---

## 🚀 Testing the Feature

### 1. **Start Backend:**
```bash
cd Backend/MoneyMatesAPI/MoneyMatesAPI
dotnet run
```

### 2. **Start Frontend:**
```bash
cd Frontend
npm start
```

### 3. **Test the Feature:**
1. Login to your account
2. Go to Budget Categories section
3. Expand a category (e.g., "Food")
4. Click "+ Add Expense"
5. Fill in amount (e.g., 500)
6. Click on "Bill Photo" file input
7. Select a JPG/PNG image from your computer
8. **See the preview appear!**
9. Click "Add Expense"
10. Category total updates automatically
11. Next time you view, see 📷 icon

---

## 📱 UI Flow

```
USER CLICKS "+ Add Expense"
         ↓
FORM OPENS with:
├── Amount input
├── Description input
├── [NEW] Bill Photo file input
└── Preview area (empty initially)
         ↓
USER SELECTS IMAGE
         ↓
PREVIEW APPEARS showing:
├── Image thumbnail
└── [✕ Remove Image] button
         ↓
USER CLICKS "Add Expense"
         ↓
EXPENSE SAVED with bill photo
         ↓
EXPENSE LIST shows:
├── Date: 24/01/2026
├── Amount: Rs 500
└── 📷 (icon indicating bill attached)
```

---

## 🎨 Visual Changes

### Add Expense Form Now Has:

```html
<!-- File Input -->
<input type="file" accept="image/jpeg,image/png" />

<!-- Preview Section (appears after selecting image) -->
<div class="bill-preview">
  <p>📸 Bill Preview:</p>
  <img src="[base64 image]" alt="Bill preview" />
  <button>✕ Remove Image</button>
</div>

<!-- Expense Item Shows Camera Icon -->
<span class="bill-icon">📷</span>
```

---

## 💾 Database Schema

**Before:**
```sql
CREATE TABLE Expenses (
    Id INT PRIMARY KEY,
    UserId INT,
    Category NVARCHAR(100),
    Amount DECIMAL(10,2),
    DateAdded DATETIME
);
```

**After:**
```sql
CREATE TABLE Expenses (
    Id INT PRIMARY KEY,
    UserId INT,
    Category NVARCHAR(100),
    Amount DECIMAL(10,2),
    DateAdded DATETIME,
    BillImageBase64 NVARCHAR(MAX) NULL  -- NEW COLUMN
);
```

---

## 📤 API Payload Example

**Before (without image):**
```json
{
  "UserId": 1,
  "Category": "Food",
  "Amount": 500
}
```

**After (with image):**
```json
{
  "UserId": 1,
  "Category": "Food",
  "Amount": 500,
  "BillImageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

---

## ✔️ Validation Rules

| Rule | Value | Error Message |
|------|-------|---------------|
| File Type | JPG, PNG only | "Only JPG and PNG images are allowed" |
| File Size | Max 5MB | "Image size must be less than 5MB" |
| Amount | Required, > 0 | "Please enter a valid amount" |
| Image | Optional | Can submit without image |

---

## 🔍 Debugging

### If Image Doesn't Upload:

1. **Check Console Logs:**
   - Open DevTools (F12) → Console
   - Look for: `"Image converted to base64, size: [number]"`
   - If size is 0, image upload failed

2. **Check Network Tab:**
   - Look at POST request to `/api/expenses`
   - Verify `BillImageBase64` field contains data
   - Check response status (should be 200)

3. **Check Database:**
   ```sql
   SELECT Id, Category, Amount, LEN(BillImageBase64) as ImageSizeBytes
   FROM Expenses
   WHERE BillImageBase64 IS NOT NULL;
   ```
   - Should show image data size in bytes

---

## 📝 File Changes Summary

| File | Change | Lines |
|------|--------|-------|
| `Expense.cs` | Added `BillImageBase64` field | +1 |
| `CategorySection.jsx` | Added image upload & preview UI | +80 |
| `expenseService.js` | Updated `addExpense()` to send image | +8 |
| `CategorySection.css` | Added styling for file input & preview | +60 |
| BILL_UPLOAD_EXPLANATION.md | Complete explanation (this document) | - |

---

## 🚀 Next Steps

After running the migration:

1. ✅ Test uploading an expense with a bill photo
2. ✅ Verify the image appears in the preview
3. ✅ Check that 📷 icon shows on expense items with images
4. ✅ Delete an expense with an image to confirm it deletes from DB

---

## ❓ FAQ

**Q: Can I upload images larger than 5MB?**
A: No, frontend blocks it. Backend doesn't validate yet (could add if needed).

**Q: What happens if I delete an expense with a photo?**
A: The entire expense record (including photo) is deleted from database.

**Q: How much database space does an image take?**
A: Roughly 33% more than the original file. E.g., 500KB JPG → 667KB in database.

**Q: Can I see the image after uploading?**
A: Currently shows 📷 icon. Could add modal popup to view full image (future feature).

**Q: What image formats are supported?**
A: JPG and PNG only (most common formats).

---

## 🎯 Summary

✅ **Feature Ready!** Just need to:
1. Run migration command
2. Restart backend
3. Test the feature

That's it! Users can now upload bill photos with expenses. 📸

