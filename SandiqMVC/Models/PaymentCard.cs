namespace SandiqMVC.Models;

public class PaymentCard
{
    public int Id { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string CardNumber { get; set; } = string.Empty;
    public string CardHolderName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
