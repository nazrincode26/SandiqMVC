using Microsoft.AspNetCore.Mvc;

namespace SandiqMVC.Controllers;

public class CartController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}