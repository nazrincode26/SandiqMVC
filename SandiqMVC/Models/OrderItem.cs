using System.ComponentModel.DataAnnotations.Schema;

namespace SandiqMVC.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string Title { get; set; } = string.Empty;
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }

    public int SellerUserId { get; set; }
    public User? Seller { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PlatformFeeAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal SellerAmount { get; set; }
}
