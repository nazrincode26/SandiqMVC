using System.ComponentModel.DataAnnotations.Schema;

namespace SandiqMVC.Models;

public class Order
{
    public const decimal PlatformFeeRate = 0.30m;

    public int Id { get; set; }
    public int BuyerUserId { get; set; }
    public User? Buyer { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal PlatformFeeAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal SellerPayoutAmount { get; set; }

    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}
