using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Genxyz.Controllers
{
    public class HomeController : Controller
    {
        [Authorize]
        public ActionResult Index(int? id)
        {
            if (id == null)
            {
                return View();
            }
            else
            {
                //redirect to Genxyz page.
                return RedirectToAction("","Genxyz");
            }
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}