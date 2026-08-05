using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SandiqMVC.Migrations
{
    /// <inheritdoc />
    public partial class AddProductApprovedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Products",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Products");
        }
    }
}
