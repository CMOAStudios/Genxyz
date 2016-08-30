using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Genxyz.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace Genxyz
{
    [Authorize]
    public class Generic
    {
        public static List<object> GetValidationErrors(ModelStateDictionary ModelState)
        {
            List<object> errors = new List<object>();
            foreach (var x in ModelState.Keys)
            {
                if (ModelState[x].Errors.Count > 0)
                {
                    errors.Add(new
                    {
                        key = x,
                        value = ModelState[x].Errors.
                            Select(y => y.ErrorMessage).ToArray()
                    });
                }
            }

            return errors;
        }

        public static string GetUserName()
        {
            UserManager<ApplicationUser> manager = new UserManager<ApplicationUser>(
            new UserStore<ApplicationUser>(
                new ApplicationDbContext()));
            try {
                var myUsername = manager.FindById(HttpContext.Current.User.Identity.GetUserId()).UserName;
                return myUsername;
            }
            catch
            {
                return "N/A";
            }
        }

        public static string GetUserDisplayName(string UserID ="", string UserName = "")
        {
            UserManager<ApplicationUser> manager = new UserManager<ApplicationUser>(
            new UserStore<ApplicationUser>(
                new ApplicationDbContext()));
            try
            {
                if (UserID == "" && UserName == "")
                {
                    UserID = HttpContext.Current.User.Identity.GetUserId();
                }

                ApplicationUser usr;
                if (UserID != "")
                {
                    usr = manager.FindById(UserID);
                } else
                {
                    usr = manager.FindByEmail(UserName);
                }
                return usr.FullName;
            }
            catch
            {
                return "N/A";
            }
        }

        public static string GetUserID()
        {
            return HttpContext.Current.User.Identity.GetUserId();
        }
    }
}