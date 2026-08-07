using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SandiqMVC.DAL;
using SandiqMVC.Models;
using SandiqMVC.ViewModels;
using System.Diagnostics;

namespace SandiqMVC.Controllers
{
    public class HomeController : Controller
    {
        private readonly SandiqMvcDbContext _context;

        public HomeController(SandiqMvcDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var viewModel = new HomeViewModel
            {
                Categories = await _context.Categories.Where(c => c.ParentId == null).ToListAsync(),
                Products = await _context.Products
                    .Where(p => p.Status == "approved")
                    .Include(p => p.Category)
                    .ToListAsync()
            };

            return View(viewModel);
        }

        public IActionResult Privacy()
        {
            return View();
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


        [Route("Home/StatusCode")]
        public IActionResult HandleStatusCode(int code)
        {
            return View("NotFound");
        }
    }

}