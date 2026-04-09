using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyMatesAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupExpenseSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupExpenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    PaidByUserId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BillImageBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateAdded = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupExpenses_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupExpenses_Users_PaidByUserId",
                        column: x => x.PaidByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupExpenseSplits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupExpenseId = table.Column<int>(type: "int", nullable: false),
                    UserIdOwes = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsSettled = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupExpenseSplits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupExpenseSplits_GroupExpenses_GroupExpenseId",
                        column: x => x.GroupExpenseId,
                        principalTable: "GroupExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupExpenseSplits_Users_UserIdOwes",
                        column: x => x.UserIdOwes,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupExpenses_GroupId",
                table: "GroupExpenses",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupExpenses_PaidByUserId",
                table: "GroupExpenses",
                column: "PaidByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupExpenseSplits_GroupExpenseId",
                table: "GroupExpenseSplits",
                column: "GroupExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupExpenseSplits_UserIdOwes",
                table: "GroupExpenseSplits",
                column: "UserIdOwes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupExpenseSplits");

            migrationBuilder.DropTable(
                name: "GroupExpenses");
        }
    }
}
