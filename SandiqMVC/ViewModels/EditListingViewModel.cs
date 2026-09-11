using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using SandiqMVC.Models;

namespace SandiqMVC.ViewModels;

public class EditListingViewModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Başlıq tələb olunur")]
    [Display(Name = "Başlıq")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Təsvir tələb olunur")]
    [Display(Name = "Təsvir")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Qiymət tələb olunur")]
    [Range(0, double.MaxValue, ErrorMessage = "Qiymət mənfi ola bilməz")]
    [Display(Name = "Qiymət (₼)")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Kateqoriya seçin")]
    [Display(Name = "Kateqoriya")]
    public int CategoryId { get; set; }

    [Display(Name = "Vəziyyət")]
    public string Condition { get; set; } = "used";

    [Display(Name = "Yerləşdiyi yer")]
    public string? Location { get; set; }

    public int? SubcategoryId { get; set; }
    public List<string> ExistingImages { get; set; } = new();
    public List<IFormFile>? ImageFiles { get; set; }

    public List<Category> Categories { get; set; } = new();
}