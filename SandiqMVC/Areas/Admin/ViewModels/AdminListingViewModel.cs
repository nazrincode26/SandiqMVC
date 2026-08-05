using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.Areas.Admin.ViewModels;

public class AdminListingViewModel
{
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public decimal Price { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? SubcategoryId { get; set; }

    public string? Condition { get; set; } = "used";

    public string? Location { get; set; }
}