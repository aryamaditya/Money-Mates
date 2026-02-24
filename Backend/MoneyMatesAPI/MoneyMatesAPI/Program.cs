using MoneyMatesAPI.Hubs;
using MoneyMatesAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------
// Configure Logging
// ---------------------------
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddFilter("Microsoft.AspNetCore.SignalR", LogLevel.Debug);
builder.Logging.AddFilter("MoneyMatesAPI", LogLevel.Information);

// ---------------------------
// Add DbContext
// ---------------------------
builder.Services.AddDbContext<MoneyMatesDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---------------------------
// Add CORS for React
// ---------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ---------------------------
// Add Controllers and Swagger
// ---------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var app = builder.Build();

// ---------------------------
// Use Swagger in Development
// ---------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ---------------------------
// Enable CORS
// ---------------------------
app.UseCors("AllowReactApp");

// Disabled for development to allow HTTP from React
// app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GroupChatHub>("/hubs/groupchat");

app.Run();
