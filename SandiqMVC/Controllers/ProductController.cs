using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;

namespace SandiqMVC.Controllers;

public class ProductController : Controller
{
    private readonly SandiqMvcDbContext _context;

    public ProductController(SandiqMvcDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Details(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.SubmittedBy)
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == "approved");

        if (product == null) return NotFound();

        return View(product);
    }
}