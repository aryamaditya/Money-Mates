using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Hubs
{
    public class GroupChatHub : Hub
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GroupChatHub> _logger;

        public GroupChatHub(IServiceProvider serviceProvider, ILogger<GroupChatHub> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"[Hub] Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"[Hub] Client disconnected: {Context.ConnectionId}, Exception: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a group chat room
        /// </summary>
        public async Task JoinGroup(int groupId, int userId)
        {
            try
            {
                _logger.LogInformation($"[JoinGroup] START - groupId={groupId}, userId={userId}");
                
                // Add to SignalR group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
                _logger.LogInformation($"[JoinGroup] Added to SignalR group");
                
                // Notify caller
                await Clients.Caller.SendAsync("JoinedGroup", new { groupId });
                _logger.LogInformation($"[JoinGroup] Sent JoinedGroup notification to caller");
                
                // Get user and notify group
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<MoneyMatesDbContext>();
                    var user = await context.Users.FindAsync(userId);
                    
                    if (user != null)
                    {
                        await Clients.Group($"group_{groupId}")
                            .SendAsync("UserJoined", new { userId, userName = user.Name });
                        _logger.LogInformation($"[JoinGroup] User {user.Name} joined group {groupId}");
                    }
                }
                
                _logger.LogInformation($"[JoinGroup] SUCCESS");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[JoinGroup] FAILED - {ex.Message}");
                await Clients.Caller.SendAsync("Error", $"Failed to join group: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Leave a group chat room
        /// </summary>
        public async Task LeaveGroup(int groupId, int userId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group_{groupId}");
                
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<MoneyMatesDbContext>();
                    var user = await context.Users.FindAsync(userId);
                    if (user != null)
                    {
                        await Clients.Group($"group_{groupId}")
                            .SendAsync("UserLeft", new { userId, userName = user.Name });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in LeaveGroup: {ex.Message}");
            }
        }

        /// <summary>
        /// Send a message to the group (text, image, or audio)
        /// </summary>
        public async Task SendMessage(int groupId, int senderId, string content, string? fileUrl = null, string? fileType = null)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<MoneyMatesDbContext>();
                    
                    // Save message to database
                    var message = new GroupMessage
                    {
                        GroupId = groupId,
                        SenderId = senderId,
                        Content = content,
                        FileUrl = fileUrl,
                        FileType = fileType,
                        SentAt = DateTime.Now
                    };

                    context.GroupMessages.Add(message);
                    await context.SaveChangesAsync();

                    // Get sender details
                    var sender = await context.Users.FindAsync(senderId);
                    
                    // Broadcast to all users in the group
                    await Clients.Group($"group_{groupId}")
                        .SendAsync("ReceiveMessage", new
                        {
                            id = message.Id,
                            groupId = message.GroupId,
                            senderId = message.SenderId,
                            senderName = sender?.Name ?? "Unknown",
                            content = message.Content,
                            fileUrl = message.FileUrl,
                            fileType = message.FileType,
                            sentAt = message.SentAt
                        });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SendMessage: {ex.Message}");
                await Clients.Caller.SendAsync("Error", $"Failed to send message: {ex.Message}");
            }
        }
    }
}
