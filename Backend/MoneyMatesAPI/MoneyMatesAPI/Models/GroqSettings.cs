namespace MoneyMatesAPI.Models
{
    public class GroqSettings
    {
        public string? ApiKey { get; set; }
        public string? Model { get; set; }
        public string? ApiUrl { get; set; }
        public int TimeoutSeconds { get; set; }
        public int MaxRetries { get; set; }

        public GroqSettings()
        {
            ApiUrl = "https://api.groq.com/openai/v1/chat/completions";
            TimeoutSeconds = 10;
            MaxRetries = 2;
            Model = "llama-3.1-8b-instant";
        }
    }
}
