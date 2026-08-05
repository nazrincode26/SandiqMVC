using Microsoft.AspNetCore.Mvc;

namespace SandiqMVC.Controllers;

public class InfoController : Controller
{
    public IActionResult Legal() => View();
    public IActionResult Rules() => View();
    public IActionResult About() => View();
    public IActionResult Contact() => View();
}