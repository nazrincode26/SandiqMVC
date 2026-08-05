using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.ViewModels;

public class ForgotPasswordViewModel
{
    [Required(ErrorMessage = "E-poçt tələb olunur")]
    [EmailAddress(ErrorMessage = "Düzgün e-poçt daxil edin")]
    public string Email { get; set; } = string.Empty;
}
