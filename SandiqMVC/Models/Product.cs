using System.ComponentModel.DataAnnotations.Schema;

namespace SandiqMVC.Models;

public class Product
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? SubcategoryId { get; set; }
    public Category? Subcategory { get; set; }
    public int SubmittedByUserId { get; set; }
    public User? SubmittedBy { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
}