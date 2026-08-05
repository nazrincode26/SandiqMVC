using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.Areas.Admin.ViewModels;

public class CategoryViewModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Ad tələb olunur")]
    [Display(Name = "Ad (AZ)")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Ad (RU)")]
    public string? NameRu { get; set; }

    [Display(Name = "Ad (EN)")]
    public string? NameEn { get; set; }

    [Display(Name = "İkon URL")]
    public string? Icon { get; set; }

    public int? ParentId { get; set; }
}