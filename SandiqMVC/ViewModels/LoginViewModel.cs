using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.ViewModels;

public class LoginViewModel
{
    [Required(ErrorMessage = "E-poçt tələb olunur")]
    [EmailAddress(ErrorMessage = "Düzgün e-poçt daxil edin")]
    [Display(Name = "E-poçt")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifrə tələb olunur")]
    [DataType(DataType.Password)]
    [Display(Name = "Şifrə")]
    public string Password { get; set; } = string.Empty;
}