using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.ViewModels;

public class SettingsViewModel
{
    [Required(ErrorMessage = "Ad Soyad tələb olunur")]
    [Display(Name = "Ad Soyad")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-poçt tələb olunur")]
    [EmailAddress(ErrorMessage = "Düzgün e-poçt daxil edin")]
    [Display(Name = "E-poçt")]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Telefon")]
    public string? Phone { get; set; }
}