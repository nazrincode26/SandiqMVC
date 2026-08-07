namespace SandiqMVC.Models;

public class SellerReview
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public User? Seller { get; set; }
    public int ReviewerUserId { get; set; }
    public User? Reviewer { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
