using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyMatesAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSettlementImageToGroupExpenseSplit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SettlementImageBase64",
                table: "GroupExpenseSplits",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SettlementImageBase64",
                table: "GroupExpenseSplits");
        }
    }
}
