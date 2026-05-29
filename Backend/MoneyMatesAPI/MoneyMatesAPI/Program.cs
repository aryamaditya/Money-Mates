using MoneyMatesAPI.Hubs;
using MoneyMatesAPI.Data;
using MoneyMatesAPI.Services;
using MoneyMatesAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using DotNetEnv;

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
// Load Environment Variables and Configure Groq AI Service
// ---------------------------
// Load .env file if it exists
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    DotNetEnv.Env.Load(envPath);
}

var groqSettings = new GroqSettings
{
    ApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? builder.Configuration["GroqSettings:ApiKey"] ?? "",
    Model = Environment.GetEnvironmentVariable("GROQ_MODEL") ?? "llama-3.1-8b-instant",
    ApiUrl = "https://api.groq.com/openai/v1/chat/completions",
    TimeoutSeconds = 10,
    MaxRetries = 2
};

// Register Groq settings as singleton
builder.Services.AddSingleton(groqSettings);

// Register HttpClient for Groq API
builder.Services.AddHttpClient<IGroqAIService, GroqAIService>();

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
string groupUploadsPath = @"D:\College Work\FYP\Money-Mates\GroupUploads";
string personalBillsPath = @"D:\College Work\FYP\Money-Mates\Personal Bills";

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation($"Configuring static files at: {groupUploadsPath}");
logger.LogInformation($"Configuring static files at: {personalBillsPath}");

// Create the GroupUploads directory if it doesn't exist
if (!Directory.Exists(groupUploadsPath))
{
    Directory.CreateDirectory(groupUploadsPath);
    logger.LogInformation($"Created GroupUploads directory at {groupUploadsPath}");
}
else
{
    logger.LogInformation($"GroupUploads directory already exists at {groupUploadsPath}");
}

// Create the Personal Bills directory if it doesn't exist
if (!Directory.Exists(personalBillsPath))
{
    Directory.CreateDirectory(personalBillsPath);
    logger.LogInformation($"Created Personal Bills directory at {personalBillsPath}");
}
else
{
    logger.LogInformation($"Personal Bills directory already exists at {personalBillsPath}");
}

// Enable default static files middleware
app.UseStaticFiles();

// Enable custom static files for group uploads
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(groupUploadsPath),
    RequestPath = "/uploads"
});

// Enable custom static files for personal bills
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(personalBillsPath),
    RequestPath = "/uploads"
});

// Disabled for development to allow HTTP from React
// app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GroupChatHub>("/hubs/groupchat");

app.Run();
