using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyMatesAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDailyBudgetSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BudgetedAmount",
                table: "DailyBudgets",
                newName: "TotalDailyBudget");

            migrationBuilder.AddColumn<decimal>(
                name: "AllocatedAmount",
                table: "DailyBudgets",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "DailyBudgets",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllocatedAmount",
                table: "DailyBudgets");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "DailyBudgets");

            migrationBuilder.RenameColumn(
                name: "TotalDailyBudget",
                table: "DailyBudgets",
                newName: "BudgetedAmount");
        }
    }
}
