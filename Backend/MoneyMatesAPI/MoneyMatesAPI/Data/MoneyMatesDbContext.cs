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
        public DbSet<DailyBudget> DailyBudgets { get; set; } = null!;
        public DbSet<Income> Income { get; set; }
        public DbSet<Group> Groups { get; set; } = null!;
        public DbSet<GroupMember> GroupMembers { get; set; } = null!;
        public DbSet<GroupMessage> GroupMessages { get; set; } = null!;
        public DbSet<GroupExpense> GroupExpenses { get; set; } = null!;
        public DbSet<GroupExpenseSplit> GroupExpenseSplits { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure GroupExpenseSplit relationships to avoid cascade delete cycles
            modelBuilder.Entity<GroupExpenseSplit>()
                .HasOne(s => s.UserOwes)
                .WithMany()
                .HasForeignKey(s => s.UserIdOwes)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
