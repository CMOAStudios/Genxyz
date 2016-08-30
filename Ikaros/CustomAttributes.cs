using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using Genxyz.Models;
using Microsoft.AspNet.Identity.EntityFramework;

namespace Genxyz
{
    //just to allow ignoring while not allowing anons.
    public class IgnoreUpdatePasswordFilter : ActionFilterAttribute
    {

    }

    #region Authorization
    /*
    //an extension of authorized.
    public class RequireUpdatedPassword : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (filterContext.ActionDescriptor.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Any() || filterContext.ActionDescriptor.GetCustomAttributes(typeof(IgnoreUpdatePasswordFilter), false).Any())
            {
                return;
            }
            //This is going to "override" authorize in some cases.
            var uid = HttpContext.Current.User.Identity.GetUserId();
            var data = filterContext.RouteData.Values;
            string con = (string)data["controller"];
            string act = (string)data["action"];
            if (con != "Account" || act != "Login")
            {
                if (uid == null)
                {
                    return;
                }
                else
                {
                    UserManager<ApplicationUser> manager = new UserManager<ApplicationUser>(new UserStore<ApplicationUser>(new SkiffieContext()));
                    var usr = manager.FindById(uid);
                    if (usr.Disabled)
                    {
                        filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Account" }, { "action", "Login" } });
                    } else if (usr.PasswordChange && con != "Manage" && act != "ChangePassword")
                    {
                        filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Manage" }, { "action", "ChangePassword" } });
                    }
                }
            }
        }
    }

    //Super User check!
    public class SuperUserFilter : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var uid = HttpContext.Current.User.Identity.GetUserId();
            if (uid == null)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "lolno" } });
            }
            UserManager<ApplicationUser> manager = new UserManager<ApplicationUser>(new UserStore<ApplicationUser>(new SkiffieContext()));
            var superUser = manager.FindById(uid).SuperUser;
            var targetSuperUser = manager.FindById(filterContext.RouteData.Values["id"].ToString()).SuperUser;

            if (targetSuperUser && !superUser)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "lolno" } });
            }
        }
    }
    */
    #endregion

    #region Instances
    public class FindInInstance : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var username = Generic.GetUserName();
            if (username == null)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
            var db = new ApplicationDbContext();
            // check for a few options.
            int ID = Convert.ToInt16(filterContext.ActionParameters["InstanceID"]);
            var instance = db.Instances.Include("Members").FirstOrDefault(x => x.InstanceID == ID);
            if (instance == null)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
            if (!instance.Members.Any(x => x.UserName == username) || instance.Active == false)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
        }
    }

    //check if the user is the owner.
    public class InstanceOwner : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var username = Generic.GetUserName();
            if (username == null)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
            var db = new ApplicationDbContext();
            // check for a few options.
            int ID = Convert.ToInt16(filterContext.ActionParameters["InstanceID"]);
            var instance = db.Instances.FirstOrDefault(x => x.InstanceID == ID);
            if (instance == null)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
            if (instance.Creator != Generic.GetUserName() || instance.Active == false)
            {
                filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary { { "controller", "Home" }, { "action", "index" } });
                return;
            }
        }
    }
    #endregion
}