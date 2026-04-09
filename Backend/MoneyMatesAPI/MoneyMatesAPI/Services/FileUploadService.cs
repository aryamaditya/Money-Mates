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
        private readonly string _uploadBasePath;
        private readonly ILogger<FileUploadService> _logger;

        public FileUploadService(ILogger<FileUploadService> logger)
        {
            _logger = logger;
            // Use absolute path for reliability
            _uploadBasePath = @"D:\College Work\FYP\MoneyMates\GroupUploads";
            
            _logger.LogInformation($"Upload base path: {_uploadBasePath}");

            // Create base uploads directory if it doesn't exist
            try
            {
                if (!Directory.Exists(_uploadBasePath))
                {
                    Directory.CreateDirectory(_uploadBasePath);
                    _logger.LogInformation($"Created GroupUploads directory at {_uploadBasePath}");
                }
                else
                {
                    _logger.LogInformation($"GroupUploads directory exists at {_uploadBasePath}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating GroupUploads directory: {ex.Message}");
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is null or empty");

            try
            {
                _logger.LogInformation($"===== SAVE FILE START =====");
                _logger.LogInformation($"File received - Name: {file.FileName}, Size: {file.Length} bytes");

                // Create folder path: GroupUploads/folderName/
                string folderPath = Path.Combine(_uploadBasePath, folderName);
                _logger.LogInformation($"SaveFileAsync - Base path: {_uploadBasePath}");
                _logger.LogInformation($"SaveFileAsync - Folder: {folderName}");
                _logger.LogInformation($"SaveFileAsync - Full folder path: {folderPath}");

                if (!Directory.Exists(folderPath))
                {
                    _logger.LogInformation($"Folder does not exist, creating...");
                    Directory.CreateDirectory(folderPath);
                    _logger.LogInformation($"Created folder: {folderPath}");
                }
                else
                {
                    _logger.LogInformation($"Folder already exists: {folderPath}");
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
                string fullPath = Path.Combine(_uploadBasePath, filePath);
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
