using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;

namespace SandiqMVC.ViewComponents;

public class CategoryMenuViewComponent : ViewComponent
{
    private readonly SandiqMvcDbContext _context;

    public CategoryMenuViewComponent(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IViewComponentResult> InvokeAsync()
    {
        var categories = await _context.Categories
            .Where(c => c.ParentId == null)
            .ToListAsync();

        return View(categories);
    }
}