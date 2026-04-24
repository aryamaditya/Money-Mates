using MoneyMatesAPI.Hubs;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
// Add File Upload Service
// ---------------------------
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// ---------------------------
// Add SimulatedDataSeeder
// ---------------------------
builder.Services.AddScoped<SimulatedDataSeeder>();

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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Accept both camelCase and PascalCase from frontend
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Output responses in camelCase
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var app = builder.Build();

// ---------------------------
// Seed Simulated Data on Startup
// ---------------------------
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<SimulatedDataSeeder>();
    await seeder.SeedSimulatedUsersAsync();
}

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

// ---------------------------
// Configure Static File Serving for Uploads
// ---------------------------
string uploadsPath = @"D:\College Work\FYP\MoneyMates\GroupUploads";

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation($"Configuring static files at: {uploadsPath}");

// Create the GroupUploads directory if it doesn't exist
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    logger.LogInformation($"Created GroupUploads directory at {uploadsPath}");
}
else
{
    logger.LogInformation($"GroupUploads directory already exists at {uploadsPath}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Disabled for development to allow HTTP from React
// app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GroupChatHub>("/hubs/groupchat");

app.Run();
