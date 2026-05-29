using System;
using System.IO;
using System.Threading.Tasks;

namespace MoneyMatesAPI.Services
{
    public interface IFileUploadService
    {
        Task<string> SaveFileAsync(IFormFile file, string folderName);
        bool DeleteFile(string filePath);
        string GetFileUrl(string filePath);
    }

    public class FileUploadService : IFileUploadService
    {
        private readonly string _groupUploadsPath;
        private readonly string _personalBillsPath;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(ILogger<FileUploadService> logger)
        {
            _logger = logger;
            // Use absolute paths for reliability
            _groupUploadsPath = @"D:\College Work\FYP\Money-Mates\GroupUploads";
            _personalBillsPath = @"D:\College Work\FYP\Money-Mates\Personal Bills";
            
            _logger.LogInformation($"Group uploads path: {_groupUploadsPath}");
            _logger.LogInformation($"Personal bills path: {_personalBillsPath}");

            // Create directories if they don't exist
            CreateDirectoryIfNotExists(_groupUploadsPath, "GroupUploads");
            CreateDirectoryIfNotExists(_personalBillsPath, "Personal Bills");
        }

        private void CreateDirectoryIfNotExists(string path, string displayName)
        {
            try
            {
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                    _logger.LogInformation($"Created {displayName} directory at {path}");
                }
                else
                {
                    _logger.LogInformation($"{displayName} directory exists at {path}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating {displayName} directory: {ex.Message}");
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is null or empty");

            try
            {
                _logger.LogInformation($"===== SAVE FILE START =====");
                _logger.LogInformation($"File received - Name: {file.FileName}, Size: {file.Length} bytes, Folder: {folderName}");

                // Determine base path based on folder name
                // "bills" (personal expenses) → Personal Bills folder
                // Everything else → GroupUploads folder
                string basePath = folderName.Equals("bills", StringComparison.OrdinalIgnoreCase) 
                    ? _personalBillsPath 
                    : _groupUploadsPath;

                _logger.LogInformation($"Using base path: {basePath}");

                // Create folder path
                string folderPath = Path.Combine(basePath, folderName);
                _logger.LogInformation($"Folder path: {folderPath}");

                if (!Directory.Exists(folderPath))
                {
                    _logger.LogInformation($"Folder does not exist, creating...");
                    Directory.CreateDirectory(folderPath);
                    _logger.LogInformation($"Created folder: {folderPath}");
                }
                else
                {
                    _logger.LogInformation($"Folder already exists");
                }

                // Generate unique filename
                string fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                string filePath = Path.Combine(folderPath, fileName);
                _logger.LogInformation($"Generated filename: {fileName}");
                _logger.LogInformation($"Full file path: {filePath}");

                // Save file to disk
                _logger.LogInformation($"Attempting to save file...");
                try
                {
                    using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 4096, useAsync: true))
                    {
                        _logger.LogInformation($"FileStream created, copying file...");
                        await file.CopyToAsync(fileStream);
                        fileStream.Flush();
                        await fileStream.FlushAsync();
                        _logger.LogInformation($"File copied to stream and flushed");
                    }
                    _logger.LogInformation($"FileStream disposed successfully");
                }
                catch (IOException ioEx)
                {
                    _logger.LogError($"IO Exception during file save: {ioEx.Message}");
                    throw;
                }

                // Verify file exists
                if (File.Exists(filePath))
                {
                    _logger.LogInformation($"✓ File successfully saved and verified");
                }
                else
                {
                    _logger.LogWarning($"✗ File save verification failed - file not found at {filePath}");
                }

                // Return relative path for storage in database
                // e.g., "bills/guid_filename.jpg"
                string relativePath = Path.Combine(folderName, fileName).Replace("\\", "/");
                _logger.LogInformation($"✓ Returning relative path: {relativePath}");
                _logger.LogInformation($"===== SAVE FILE SUCCESS =====");

                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError($"✗ ERROR SAVING FILE: {ex.GetType().Name}: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                _logger.LogInformation($"===== SAVE FILE FAILED =====");
                throw;
            }
        }

        public bool DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return false;

            try
            {
                // Check both paths for the file
                string fullPath = Path.Combine(_groupUploadsPath, filePath);
                
                if (!File.Exists(fullPath))
                {
                    fullPath = Path.Combine(_personalBillsPath, filePath);
                }

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation($"File deleted: {filePath}");
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting file: {ex.Message}");
                return false;
            }
        }

        public string GetFileUrl(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return "";

            // Convert file path to URL for frontend
            // e.g., "bills/guid_filename.jpg" → "/uploads/bills/guid_filename.jpg"
            return $"/uploads/{filePath}";
        }
    }
}
