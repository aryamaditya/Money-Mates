using Microsoft.EntityFrameworkCore;
using MoneyMatesAPI.Models;

namespace MoneyMatesAPI.Data
{
    public class MoneyMatesDbContext : DbContext
    {
        public MoneyMatesDbContext(DbContextOptions<MoneyMatesDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Expense> Expenses { get; set; } = null!;
        public DbSet<Budget> Budgets { get; set; } = null!;
        public DbSet<Income> Income { get; set; }
        public DbSet<Group> Groups { get; set; } = null!;
        public DbSet<GroupMember> GroupMembers { get; set; } = null!;
        public DbSet<GroupMessage> GroupMessages { get; set; } = null!;
    }
}
