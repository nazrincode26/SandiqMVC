using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.ViewModels;

public class ResetPasswordViewModel
{
    [Required(ErrorMessage = "E-poçt tələb olunur")]
    [EmailAddress(ErrorMessage = "Düzgün e-poçt daxil edin")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Kod tələb olunur")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Yeni şifrə tələb olunur")]
    [MinLength(6, ErrorMessage = "Şifrə ən azı 6 simvol olmalıdır")]
    public string NewPassword { get; set; } = string.Empty;
}
