using MoneyMatesAPI.Data;
using MoneyMatesAPI.Models;
using BCrypt.Net;

namespace MoneyMatesAPI.Services
{
    public class SimulatedDataSeeder
    {
        private readonly MoneyMatesDbContext _context;
        private readonly Random _random = new();

        public SimulatedDataSeeder(MoneyMatesDbContext context)
        {
            _context = context;
        }

        public async Task SeedSimulatedUsersAsync()
        {
            // Check if simulated users already exist (idempotent)
            if (_context.Users.Any(u => u.IsSimulated))
            {
                Console.WriteLine("✓ Simulated users already exist. Skipping seed.");
                return;
            }

            Console.WriteLine("🌱 Seeding simulated users and expenses...");

            var categories = new[] { "Food", "Transport", "Entertainment", "Savings", "Miscellaneous" };
            var categoryWeights = new decimal[] { 0.35m, 0.20m, 0.15m, 0.20m, 0.10m };

            // Create 20 simulated users
            for (int userIdx = 1; userIdx <= 20; userIdx++)
            {
                var simUser = new User
                {
                    Name = $"User_SIM_{userIdx:D3}",
                    Email = $"sim{userIdx}@system.local",
                    Password = BCrypt.Net.BCrypt.HashPassword("SIM_User_Password"),
                    IsFirstLogin = false,
                    IsSimulated = true
                };

                _context.Users.Add(simUser);
                await _context.SaveChangesAsync();

                // Generate 12 months of expenses
                var today = DateTime.Now;
                for (int monthOffset = -11; monthOffset <= 0; monthOffset++)
                {
                    var monthDate = today.AddMonths(monthOffset);
                    var startOfMonth = new DateTime(monthDate.Year, monthDate.Month, 1);
                    var daysInMonth = DateTime.DaysInMonth(monthDate.Year, monthDate.Month);

                    // ~30 daily expenses per month
                    for (int day = 1; day <= Math.Min(30, daysInMonth); day++)
                    {
                        // Random category weighted by distribution
                        var categoryIdx = GetWeightedRandomCategory(categoryWeights);
                        var category = categories[categoryIdx];

                        // Realistic amounts per category
                        decimal amount = category switch
                        {
                            "Food" => _random.Next(1500, 6000) / 100m,           // $15-60
                            "Transport" => _random.Next(500, 4000) / 100m,       // $5-40
                            "Entertainment" => _random.Next(500, 3000) / 100m,   // $5-30
                            "Savings" => _random.Next(10000, 50000) / 100m,      // $100-500
                            _ => _random.Next(500, 3000) / 100m                  // $5-30 (Misc)
                        };

                        var expense = new Expense
                        {
                            UserId = simUser.Id,
                            Category = category,
                            Amount = amount,
                            DateAdded = startOfMonth.AddDays(day - 1),
                            IsSimulated = true
                        };

                        _context.Expenses.Add(expense);
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"  ✓ Created {simUser.Name} with {30 * 12} expenses");
            }

            Console.WriteLine("✅ Simulated data seeding complete!");
        }

        private int GetWeightedRandomCategory(decimal[] weights)
        {
            decimal roll = (decimal)_random.NextDouble();
            decimal cumulative = 0;

            for (int i = 0; i < weights.Length; i++)
            {
                cumulative += weights[i];
                if (roll < cumulative)
                    return i;
            }

            return weights.Length - 1;
        }
    }
}
