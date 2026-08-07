using System.ComponentModel.DataAnnotations.Schema;

namespace SandiqMVC.Models;

public class ListingRequest
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int RequestedByUserId { get; set; }
    public User? RequestedBy { get; set; }

    public string Type { get; set; } = "edit";
    public string Status { get; set; } = "pending";

    public string? Title { get; set; }
    public string? Description { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal? Price { get; set; }
    public int? CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public string? Image { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
