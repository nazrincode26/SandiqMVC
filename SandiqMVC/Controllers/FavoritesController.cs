using Microsoft.AspNetCore.Mvc;

namespace SandiqMVC.Controllers;

public class FavoritesController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}