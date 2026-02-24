# MoneyMates Group Feature - Setup Instructions

## Backend Setup

### 1. Database Migration

The Group feature requires creating two new database tables. Follow these steps in SQL Server Management Studio (SSMS):

```sql
-- Create Groups table
CREATE TABLE Groups (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

-- Create GroupMembers table
CREATE TABLE GroupMembers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    GroupId INT NOT NULL,
    UserId INT NOT NULL,
    JoinedDate DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Create index for faster lookups
CREATE INDEX IX_GroupMembers_GroupId ON GroupMembers(GroupId);
CREATE INDEX IX_GroupMembers_UserId ON GroupMembers(UserId);
```

### 2. Backend Restart

After running the SQL script:

1. Stop the backend application (Ctrl+C if running)
2. Rebuild the solution: 
   - In Visual Studio: Build → Rebuild Solution
3. Run the backend:
   - `dotnet run` or press F5 in Visual Studio

### 3. Verify Backend

Test the Group endpoints using the REST client in VS Code or Postman:

**Create Group:**
```http
POST http://localhost:5262/api/group/create
Content-Type: application/json

{
  "name": "Roommates",
  "description": "Shared apartment expenses",
  "createdBy": 1
}
```

**Get User Groups:**
```http
GET http://localhost:5262/api/group/user/1
```

**Get All Groups:**
```http
GET http://localhost:5262/api/group/all/available
```

**Join Group:**
```http
POST http://localhost:5262/api/group/join
Content-Type: application/json

{
  "groupId": 1,
  "userId": 2
}
```

## Frontend Status

✅ Group component created with:
- Create Group option
- Join Group option
- View existing groups
- Group member list
- Professional UI with animations

✅ Navigation integrated:
- Groups link in sidebar
- Route at `/groups`
- Back button to dashboard

✅ Service layer (groupService.js):
- `createGroup()` - Create new group
- `getUserGroups()` - Get user's groups
- `getGroupDetails()` - Get group info
- `joinGroup()` - Join existing group
- `getAllGroups()` - Get all available groups

## Files Created/Modified

### Backend Files Created:
- `Models/Group.cs` - Group model
- `Models/GroupMember.cs` - GroupMember model
- `Controllers/GroupController.cs` - Group API endpoints

### Backend Files Modified:
- `Data/MoneyMatesDbContext.cs` - Added DbSets for Groups and GroupMembers

### Frontend Files Created:
- `src/components/Group.jsx` - Main group component
- `src/components/Group.css` - Styling
- `src/services/groupService.js` - API service

### Frontend Files Modified:
- `src/pages/App.js` - Added Group route
- `src/components/dashboard/Sidebar.jsx` - Updated Groups path to /groups

## Features Implemented

### Create Group
- User enters group name and description
- Creator automatically added as member
- Stores creation date
- Returns success message

### Join Group
- Browse available groups
- Join existing groups
- Auto-prevents duplicate membership
- Shows members in group

### View Groups
- See all groups user is in
- Shows created date and joined date
- Lists all group members
- Shows member count

## Next Steps

1. Run the SQL migration script in your database
2. Restart the backend
3. Test frontend at `http://localhost:3000/groups`
4. Click "Create Group" or "Join Group"
5. Create a test group and have another user join it

## Future Enhancements

- Add group expenses tracking
- Split expenses among members
- Show who owes whom in the group
- Edit group details
- Remove members from group
- Delete group (if creator)
- Leave group option
- Group expense history
