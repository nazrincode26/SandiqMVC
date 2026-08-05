using SandiqMVC.Models;

namespace SandiqMVC.ViewModels;

public class CategoryPageViewModel
{
    public Category Category { get; set; } = null!;
    public List<Product> Products { get; set; } = new();
}