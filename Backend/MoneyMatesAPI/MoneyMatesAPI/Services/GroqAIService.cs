using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Services
{
    public interface IGroqAIService
    {
        Task<string> GenerateInsightAsync(string metricType, object metricData);
    }

    public class GroqAIService : IGroqAIService
    {
        private readonly HttpClient _httpClient;
        private readonly GroqSettings _settings;
        private readonly ILogger<GroqAIService> _logger;
        private readonly SemaphoreSlim _rateLimiter; // Limit concurrent API calls to prevent rate limit

        public GroqAIService(HttpClient httpClient, GroqSettings settings, ILogger<GroqAIService> logger)
        {
            _httpClient = httpClient;
            _settings = settings;
            _logger = logger;
            _rateLimiter = new SemaphoreSlim(1, 1); // Only 1 concurrent request at a time to avoid rate limits
            
            // Set timeout for this specific HttpClient instance
            _httpClient.Timeout = TimeSpan.FromSeconds(15); // Increased from 10 to 15 seconds for better reliability
            
            // Set Authorization header with API key
            if (!string.IsNullOrEmpty(settings.ApiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", settings.ApiKey);
                _logger.LogInformation("✅ Groq Authorization header set");
            }
            else
            {
                _logger.LogWarning("⚠️ GROQ_API_KEY not configured. AI insights will use fallback tips.");
            }
        }

        public async Task<string> GenerateInsightAsync(string metricType, object metricData)
        {
            // If API key is missing, return fallback immediately
            if (string.IsNullOrEmpty(_settings.ApiKey))
            {
                _logger.LogWarning($"⚠️ No API key for {metricType}. Using fallback.");
                return GetFallbackTip(metricType);
            }

            try
            {
                var prompt = BuildPrompt(metricType, metricData);
                _logger.LogInformation($"🔄 [{metricType.ToUpper()}] Waiting for rate limiter... (max 1 concurrent request)");
                
                // Acquire semaphore to limit concurrent requests
                await _rateLimiter.WaitAsync();
                _logger.LogInformation($"🔄 [{metricType.ToUpper()}] Rate limiter acquired. Calling Groq API for metric: {metricType}");
                
                try
                {
                    _logger.LogInformation($"📝 [{metricType.ToUpper()}] FULL PROMPT BEING SENT:\n{prompt}");
                    _logger.LogInformation($"📊 [{metricType.ToUpper()}] Metric data: {JsonSerializer.Serialize(metricData)}");
                    
                    for (int attempt = 0; attempt <= _settings.MaxRetries; attempt++)
                    {
                        try
                        {
                            var response = await CallGroqAPI(prompt, metricType);
                            
                            if (!string.IsNullOrWhiteSpace(response))
                            {
                                if (response.Length > 1000)
                                {
                                    _logger.LogWarning($"⚠️ [{metricType.ToUpper()}] Response is {response.Length} chars (exceeds 1000 limit) but still accepting on attempt {attempt + 1}. Response: {response}");
                                }
                                else
                                {
                                    _logger.LogInformation($"✅ [{metricType.ToUpper()}] Groq API success on attempt {attempt + 1} ({response.Length} chars). Response: {response}");
                                }
                                
                                // Add delay before next request to prevent rate limiting
                                if (attempt < _settings.MaxRetries)
                                {
                                    _logger.LogInformation($"⏳ [{metricType.ToUpper()}] Waiting 1000ms before releasing rate limiter for next request...");
                                    await Task.Delay(1000);
                                }
                                
                                return response;
                            }
                            else
                            {
                                _logger.LogWarning($"⚠️ [{metricType.ToUpper()}] Groq API returned empty response on attempt {attempt + 1}");
                            }
                        }
                        catch (TaskCanceledException ex)
                        {
                            _logger.LogError($"⏱️ [{metricType.ToUpper()}] TIMEOUT on attempt {attempt + 1}/{_settings.MaxRetries + 1}: {ex.Message}");
                            if (attempt >= _settings.MaxRetries)
                            {
                                _logger.LogError($"❌ [{metricType.ToUpper()}] Max retries exceeded. Will use fallback.");
                                break;
                            }
                            var delayMs = 500 * (attempt + 2); // Exponential backoff: 1000ms, 1500ms, 2000ms
                            _logger.LogInformation($"⏳ [{metricType.ToUpper()}] Waiting {delayMs}ms before retry...");
                            await Task.Delay(delayMs);
                        }
                        catch (HttpRequestException ex)
                        {
                            _logger.LogError($"🌐 [{metricType.ToUpper()}] HTTP ERROR on attempt {attempt + 1}/{_settings.MaxRetries + 1}: {ex.Message}");
                            if (ex.InnerException != null)
                                _logger.LogError($"   Inner exception: {ex.InnerException.Message}");
                            if (attempt >= _settings.MaxRetries)
                            {
                                _logger.LogError($"❌ [{metricType.ToUpper()}] Max retries exceeded. Will use fallback.");
                                break;
                            }
                            var delayMs = 500 * (attempt + 2); // Exponential backoff
                            _logger.LogInformation($"⏳ [{metricType.ToUpper()}] Waiting {delayMs}ms before retry...");
                            await Task.Delay(delayMs);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"⚠️ [{metricType.ToUpper()}] ERROR on attempt {attempt + 1}/{_settings.MaxRetries + 1}: {ex.GetType().Name}: {ex.Message}");
                            if (ex.InnerException != null)
                                _logger.LogError($"   Inner exception: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                            if (attempt >= _settings.MaxRetries)
                            {
                                _logger.LogError($"❌ [{metricType.ToUpper()}] Max retries exceeded. Will use fallback.");
                                break;
                            }
                            var delayMs = 500 * (attempt + 2); // Exponential backoff
                            _logger.LogInformation($"⏳ [{metricType.ToUpper()}] Waiting {delayMs}ms before retry...");
                            await Task.Delay(delayMs);
                        }
                    }

                    _logger.LogWarning($"❌ Groq API failed for {metricType} after {_settings.MaxRetries + 1} attempts. Using fallback tip.");
                    return GetFallbackTip(metricType);
                }
                finally
                {
                    // Always release the semaphore
                    _rateLimiter.Release();
                    _logger.LogInformation($"🔓 [{metricType.ToUpper()}] Rate limiter released");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ CRITICAL ERROR in GenerateInsightAsync for {metricType}: {ex.GetType().Name}: {ex.Message}");
                _logger.LogError($"   Stack trace: {ex.StackTrace}");
                return GetFallbackTip(metricType);
            }
        }

        private async Task<string> CallGroqAPI(string prompt, string metricType)
        {
            var payload = new
            {
                model = _settings.Model,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                temperature = 0.7,
                max_tokens = 150
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _logger.LogInformation($"📤 [{metricType.ToUpper()}] Sending request to Groq API: {_settings.ApiUrl}");
            _logger.LogInformation($"📋 [{metricType.ToUpper()}] FULL Request payload:\n{jsonPayload}");
            
            var response = await _httpClient.PostAsync(_settings.ApiUrl, content);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"❌ [{metricType.ToUpper()}] GROQ API ERROR {(int)response.StatusCode} ({response.StatusCode}):");
                _logger.LogError($"   Headers: {string.Join(", ", response.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}"))}");
                _logger.LogError($"❌ [{metricType.ToUpper()}] FULL ERROR Response Body:\n{responseContent}");
                response.EnsureSuccessStatusCode(); // This will throw
            }

            _logger.LogInformation($"📥 [{metricType.ToUpper()}] FULL Groq response received:\n{responseContent}");
            
            // Parse response
            try
            {
                using (JsonDocument doc = JsonDocument.Parse(responseContent))
                {
                    var root = doc.RootElement;
                    _logger.LogInformation($"🔍 [{metricType.ToUpper()}] Response structure: {root.ValueKind}");
                    
                    if (root.TryGetProperty("choices", out var choices))
                    {
                        _logger.LogInformation($"✓ [{metricType.ToUpper()}] 'choices' array found with {choices.GetArrayLength()} items");
                        
                        if (choices.GetArrayLength() > 0)
                        {
                            var firstChoice = choices[0];
                            if (firstChoice.TryGetProperty("message", out var message))
                            {
                                _logger.LogInformation($"✓ [{metricType.ToUpper()}] 'message' object found");
                                
                                if (message.TryGetProperty("content", out var contentElement))
                                {
                                    var result = contentElement.GetString()?.Trim() ?? "";
                                    _logger.LogInformation($"✅ [{metricType.ToUpper()}] Successfully extracted content: {result}");
                                    return result;
                                }
                                else
                                {
                                    _logger.LogError($"❌ [{metricType.ToUpper()}] 'content' field not found in message object. Message keys: {string.Join(", ", message.EnumerateObject().Select(p => p.Name))}");
                                }
                            }
                            else
                            {
                                _logger.LogError($"❌ [{metricType.ToUpper()}] 'message' field not found in choices[0]. Available keys: {string.Join(", ", firstChoice.EnumerateObject().Select(p => p.Name))}");
                            }
                        }
                        else
                        {
                            _logger.LogError($"❌ [{metricType.ToUpper()}] 'choices' array is empty");
                        }
                    }
                    else
                    {
                        _logger.LogError($"❌ [{metricType.ToUpper()}] 'choices' property not found. Root properties: {string.Join(", ", root.EnumerateObject().Select(p => p.Name))}");
                    }
                    
                    _logger.LogError($"❌ [{metricType.ToUpper()}] Response JSON structure invalid. Full root: {root.GetRawText()}");
                }
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError($"❌ [{metricType.ToUpper()}] Failed to parse JSON response: {jsonEx.Message}");
                _logger.LogError($"   Raw response: {responseContent}");
                throw;
            }

            _logger.LogWarning($"⚠️ [{metricType.ToUpper()}] Could not parse 'choices' from Groq response");
            return "";
        }

        private string BuildPrompt(string metricType, object metricData)
        {
            var json = JsonSerializer.Serialize(metricData);
            
            var systemContext = metricType switch
            {
                "spending" => @"All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.
You are a financial advisor. Analyze the spending metric comparing user vs peers.
Provide 2-3 sentences explaining their spending position and ONE specific action to improve.
Be encouraging if they're doing well, constructive if they need improvement.
Keep response under 100 words.",

                "savings" => @"All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.
You are a financial coach. Analyze the savings rate metric.
Provide 2-3 sentences on their savings discipline vs peers and personalized goal-setting advice.
If savings rate is low, suggest a concrete percentage target. If high, celebrate their discipline.
Keep response under 100 words.",

                "discretionary" => @"All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.
You are a spending analyst. Analyze their discretionary spending ratio.
Provide 2-3 sentences explaining non-essential spending impact and suggest 1-2 specific categories to cut.
Be practical and specific.
Keep response under 100 words.",

                "trend" => @"All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.
You are a trend analyst. Analyze their month-over-month savings trend.
The 'userTrend' and 'averageTrend' values are PERCENTAGE CHANGES (e.g., +33% means savings rate increased by 33 percentage points).
If positive, celebrate their improvement and suggest ways to maintain momentum.
If negative, explain the concern and recommend 2 concrete steps to reverse it.
Keep response under 100 words.",

                _ => "All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $. Analyze this financial metric and provide constructive insights."
            };

            return $@"{systemContext}

Analyze this data:
{json}

Generate a personalized insight.";
        }

        private string GetFallbackTip(string metricType)
        {
            return metricType switch
            {
                "spending" => "Review your spending patterns and compare with your peers to identify areas for optimization.",
                "savings" => "Your savings habits are important for long-term financial stability. Keep building healthy financial discipline.",
                "discretionary" => "Consider reviewing your non-essential expenses to optimize your budget.",
                "trend" => "Monitor your financial trends month-over-month to stay on track with your goals.",
                _ => "Keep tracking your finances consistently for better insights."
            };
        }
    }
}
