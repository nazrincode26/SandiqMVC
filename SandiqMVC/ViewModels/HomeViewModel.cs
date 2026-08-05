using SandiqMVC.Models;

namespace SandiqMVC.ViewModels;

public class HomeViewModel
{
    public List<Category> Categories { get; set; } = new();
    public List<Product> Products { get; set; } = new();
}