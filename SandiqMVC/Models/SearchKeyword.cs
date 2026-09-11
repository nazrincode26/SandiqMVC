namespace SandiqMVC.Models;

public class SearchKeyword
{
    public int Id { get; set; }
    public string Keyword { get; set; } = string.Empty;
    public string Lang { get; set; } = "az";
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
}
