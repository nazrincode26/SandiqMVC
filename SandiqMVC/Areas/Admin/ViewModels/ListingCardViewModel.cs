using SandiqMVC.Models;

namespace SandiqMVC.Areas.Admin.ViewModels;

public class ListingCardViewModel
{
    public Product Product { get; set; } = null!;
    public bool ShowSeller { get; set; }
    public string? StatusLabel { get; set; }
}