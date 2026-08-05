using System.Text.Json.Serialization;

namespace SandiqMVC.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameRu { get; set; }
    public string? NameEn { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }

    [JsonIgnore]
    public Category? Parent { get; set; }
    public List<Category> Subcategories { get; set; } = new();
}