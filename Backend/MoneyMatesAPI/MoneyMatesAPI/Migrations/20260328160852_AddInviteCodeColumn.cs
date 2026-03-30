using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoneyMatesAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddInviteCodeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InviteCode",
                table: "Groups",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InviteCode",
                table: "Groups");
        }
    }
}
