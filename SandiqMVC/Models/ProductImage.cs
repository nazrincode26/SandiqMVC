namespace SandiqMVC.Models;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string Path { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
