# MoneyMates Group Chat Feature - Complete Setup

## ✅ Features Implemented

### Backend (ASP.NET Core + SignalR)
1. **GroupMessage Model** - Store messages with file support
2. **GroupChatHub** - Real-time WebSocket communication
3. **GroupMessageController** - REST API endpoints
4. **File Upload** - Support for images and audio

### Frontend (React + SignalR Client)
1. **GroupChat Component** - Full chat interface
2. **Real-time Updates** - Messages appear instantly
3. **File Upload** - Photo and audio support
4. **Message Display** - Text, images, audio players

---

## 📋 Database Changes

**New Table: GroupMessages**
```sql
CREATE TABLE GroupMessages (
    Id INT PRIMARY KEY IDENTITY(1,1),
    GroupId INT NOT NULL,
    SenderId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    FileUrl NVARCHAR(500),
    FileType NVARCHAR(50),
    SentAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id),
    FOREIGN KEY (SenderId) REFERENCES Users(Id)
);
```

✅ **Status:** Table created successfully

---

## 📦 Dependencies Added

### Frontend
```bash
npm install @microsoft/signalr
```

✅ **Status:** Installed

---

## 🔧 Backend Configuration

### Program.cs Changes
- Added SignalR service: `builder.Services.AddSignalR();`
- Mapped hub: `app.MapHub<GroupChatHub>("/hubs/groupchat");`
- CORS updated to allow WebSocket connections

### File Structure
```
Backend/
├── Hubs/
│   └── GroupChatHub.cs (Real-time communication)
├── Models/
│   └── GroupMessage.cs (Message data model)
├── Controllers/
│   └── GroupMessageController.cs (API endpoints)
└── Program.cs (Updated with SignalR)
```

---

## 🎨 Frontend Structure

### Components
```
Frontend/
├── components/
│   ├── Group.jsx (Updated with chat link)
│   ├── GroupChat.jsx (NEW - Chat interface)
│   └── GroupChat.css (NEW - Chat styling)
├── services/
│   └── groupChatService.js (NEW - SignalR & API)
└── pages/
    └── App.js (Updated with route)
```

### Routes
- `/groups` - Group list
- `/groups/:groupId/chat` - Group chat

---

## 🚀 How It Works

### 1. User clicks on a group → Opens chat
   - Navigates to `/groups/{groupId}/chat`
   - Loads chat history
   - Joins real-time group

### 2. Real-time messaging via SignalR
   - WebSocket connection to `/hubs/groupchat`
   - Messages broadcast to all group members
   - Instant delivery (no page refresh needed)

### 3. File upload flow
   - Click 📷 (image) or 🎤 (audio)
   - File uploaded to `/api/groupmessage/upload`
   - Server saves to `wwwroot/uploads/`
   - Message sent with file URL
   - File displays in chat (image preview or audio player)

### 4. Message history
   - Loads past messages on chat open
   - Fetches from `/api/groupmessage/group/{groupId}`
   - Displays in chronological order

---

## 📱 UI Features

### Message Display
- **Own messages:** Purple gradient, right-aligned
- **Other messages:** White background, left-aligned
- **Sender name + timestamp:** Shows for every message
- **File previews:** Images display inline, audio has player

### Input Area
- Text input with placeholder
- 📷 Image upload button
- 🎤 Audio upload button
- ✈️ Send button (disabled if empty)

### Header
- Group name
- Member count
- Back button to group list

### User Status
- "User joined" notification
- "User left" notification
- Real-time user presence

---

## 🔌 API Endpoints

### Messages
- **GET** `/api/groupmessage/group/{groupId}` - Get all messages
- **POST** `/api/groupmessage/upload` - Upload file (form data)
- **DELETE** `/api/groupmessage/{messageId}` - Delete message

### SignalR Hub Methods
- **JoinGroup** - Join chat room (client → server)
- **LeaveGroup** - Leave chat room (client → server)
- **SendMessage** - Send message (client → server)
- **ReceiveMessage** - Receive message (server → client)
- **UserJoined** - User joined notification (server → client)
- **UserLeft** - User left notification (server → client)

---

## 📂 File Uploads

### Location
`Backend/MoneyMatesAPI/MoneyMatesAPI/bin/Debug/net8.0/wwwroot/uploads/`

### Supported Formats
- **Images:** .jpg, .png, .gif, .webp
- **Audio:** .mp3, .wav, .ogg, .webm

### File naming
Files are saved with unique GUID: `{guid}_{originalname}`

---

## 🧪 Testing the Feature

### Step 1: Start backend
```
cd Backend/MoneyMatesAPI/MoneyMatesAPI
dotnet run
```

### Step 2: Create test data (Optional)
```sql
-- Create a group
INSERT INTO Groups (Name, CreatedBy, CreatedDate) 
VALUES ('Friends', 1, GETDATE());

-- Add members
INSERT INTO GroupMembers (GroupId, UserId, JoinedDate)
VALUES (1, 1, GETDATE()), (1, 2, GETDATE());
```

### Step 3: Test in React
1. Login with user 1
2. Click "Groups" in sidebar
3. View existing groups
4. Click a group card
5. Chat opens with real-time messaging

### Step 4: Test real-time (Optional)
1. Login in one browser as user 1
2. Login in another browser as user 2
3. Both join same group chat
4. Send message from user 1 → appears instantly in user 2's chat
5. Upload image/audio → preview in chat

---

## 🔄 Real-time Flow

```
User A sends message
    ↓
GroupChat.jsx → groupChatService.sendMessage()
    ↓
SignalR connection → GroupChatHub.SendMessage()
    ↓
Message saved to database
    ↓
Broadcast to group: Clients.Group($"group_{groupId}").SendAsync("ReceiveMessage")
    ↓
User A & User B → onReceiveMessage listener
    ↓
Update messages state → Re-render chat
```

---

## ⚠️ Important Notes

1. **Backend must be running** for real-time to work
2. **SignalR requires WebSocket support** (enabled by default)
3. **CORS configured** for `http://localhost:3000` and `http://localhost:3001`
4. **Files are stored on server** (not in database)
5. **Maximum file size** depends on server config (default: 30MB)

---

## 🎯 Next Steps (Optional)

1. **Typing indicator** - Show "User is typing..."
2. **Message reactions** - Like, emoji reactions
3. **Message edit/delete** - Allow editing sent messages
4. **File download** - Download uploaded files
5. **Voice messages** - Record and send voice
6. **Message search** - Search in chat history
7. **Group settings** - Rename, add members, leave group

---

## 📊 Summary

| Feature | Status | Type |
|---------|--------|------|
| Create Group | ✅ Complete | Backend + Frontend |
| Join Group | ✅ Complete | Backend + Frontend |
| View Groups | ✅ Complete | Frontend |
| Send Text Messages | ✅ Complete | Real-time (SignalR) |
| Upload Images | ✅ Complete | File Upload + Display |
| Upload Audio | ✅ Complete | File Upload + Player |
| Message History | ✅ Complete | Database |
| Real-time Updates | ✅ Complete | WebSocket |
| User Notifications | ✅ Complete | SignalR Broadcast |

---

## 🔗 Files Updated/Created

**Backend:**
- ✅ Models/GroupMessage.cs (NEW)
- ✅ Hubs/GroupChatHub.cs (NEW)
- ✅ Controllers/GroupMessageController.cs (NEW)
- ✅ Data/MoneyMatesDbContext.cs (Updated)
- ✅ Program.cs (Updated)

**Frontend:**
- ✅ components/GroupChat.jsx (NEW)
- ✅ components/GroupChat.css (NEW)
- ✅ services/groupChatService.js (NEW)
- ✅ components/Group.jsx (Updated - added click handler)
- ✅ pages/App.js (Updated - added route)

**Database:**
- ✅ GroupMessages table (NEW)

---

**All set! Your group chat feature is ready! 🎉**
