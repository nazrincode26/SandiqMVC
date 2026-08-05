using System.ComponentModel.DataAnnotations;

namespace SandiqMVC.ViewModels;

public class CompleteProfileViewModel
{
    [Required(ErrorMessage = "Telefon nömrəsi tələb olunur")]
    public string Phone { get; set; } = string.Empty;
}
