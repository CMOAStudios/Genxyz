using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Genxyz.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace Genxyz.Controllers
{
    [Authorize]
    public class InstancesController : Controller
    {
        DateTime Time
        {
            get
            {
                if (Session["TimeStamp"] == null)
                {
                    Session["TimeStamp"] = DateTime.MinValue;
                }
                return (DateTime)Session["TimeStamp"];
            }
            set
            {

            }
        }

        DateTime TempTime
        {
            get
            {
                if (Session["TempTimeStamp"] == null)
                {
                    Session["TempTimeStamp"] = DateTime.MinValue;
                }
                return (DateTime)Session["TempTimeStamp"];
            }
            set
            {

            }
        }

        private ApplicationDbContext db = new ApplicationDbContext();
        private UserManager<ApplicationUser> manager = new UserManager<ApplicationUser>(
            new UserStore<ApplicationUser>(
                new ApplicationDbContext()));

        public ActionResult GetInstances()
        {
            var myUsername = Generic.GetUserName();
            var instances = db.Instances.Where(x => x.Active && x.Members.Any(y => y.UserName == myUsername) == true).ToList();
            List<InstanceIndex> instancesIndices = new List<InstanceIndex>();
            foreach (var i in instances)
            {
                instancesIndices.Add(new InstanceIndex(i));
            }
            return PartialView("_GetInstances", instancesIndices);
        }

        public ActionResult InboundInvites()
        {
            var myUserName = Generic.GetUserName();
            var invites = db.Invites.Where(x => x.Accepted == null && x.Active == true && x.Recipient == myUserName);
            if (invites.Count() > 0)
            {
                var inviteList = new List<InboundInvites>();
                foreach (var i in invites)
                {
                    inviteList.Add(new InboundInvites(i));
                }
                return PartialView("_InboundInvites", inviteList);
            }
            return null;
        }


        //get members of an instance.
        [FindInInstance]
        public ActionResult InstanceMembers(int InstanceID)
        {
            var members = db.Members.Where(x => x.InstanceID == InstanceID);
            var memberList = new List<MemberList>();

            foreach (var m in members)
            {
                memberList.Add(new MemberList(m));
            }

            var invitees = db.Invites.Where(x => x.InstanceID == InstanceID && x.Accepted == null && x.Active).ToList();

            foreach (var i in invitees)
            {
                memberList.Add(new MemberList(i));
            }

            ViewBag.InstanceID = InstanceID;

            return PartialView("_InstanceMembers", memberList);
        }

        // GET: Instances
        public ActionResult Index()
        {
            return View(db.Instances.Where(x=>x.Active).ToList());
        }
        
        public ActionResult Create()
        {
            return PartialView("_Create");
        }

        [HttpPost, ActionName("CreateJSON")]
        [ValidateAntiForgeryToken]
        public ActionResult CreateInstance([Bind(Include ="Name")] InstanceCreate instance)
        {
            if (ModelState.IsValid)
            {
                var config = new InstanceConfiguration { DisplayName = instance.Name, BackgroundColor = "rgba(0,0,0,1)" };
                db.InstanceConfigurations.Add(config);
                db.SaveChanges();
                var usr = Generic.GetUserName();
                var inst = new Instance
                {
                    Name = instance.Name,
                    Creator = usr,
                    CreationDate = DateTime.Now,
                    Members = new List<Member>(),
                    Active = true,
                    InstanceConfigurationID = config.InstanceConfigurationID
                };
                db.Instances.Add(inst);
                db.SaveChanges();
                var layer = new Layer ( new CreateLayer { InstanceID = inst.InstanceID, Name = "Default" });
                var mem = new Member { UserName = usr, InstanceID = inst.InstanceID };
                db.Layers.Add(layer);
                db.Members.Add(mem);
                db.SaveChanges();
                return Json(new { refresh = true });
            }
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }


        public ActionResult DeleteInstance()
        {
            return PartialView("_Delete");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [InstanceOwner]
        public ActionResult DeleteJSON(int InstanceID)
        { 
            var instance = db.Instances.FirstOrDefault(x => x.Active && x.InstanceID == InstanceID);
            if (instance == null)
            {
                ModelState.AddModelError("", "Unable to find instance.");
            }
            
            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            //now delete.
            instance.Active = false;
            db.SaveChanges();

            return Json(new { refresh = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [InstanceOwner]
        public ActionResult EditInstance([Bind(Prefix ="item")] InstanceEdit edit, int InstanceID)
        {
            var instance = db.Instances.FirstOrDefault(x => x.Active && x.InstanceID == InstanceID);
            if (instance == null)
            {
                ModelState.AddModelError("", "Unable to find instance.");
            }

            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            instance.Name = edit.Name;
            db.SaveChanges();

            return Json(new { success = true });
        }

        #region Invites.
        [FindInInstance]
        public ActionResult CreateInvite(int InstanceID)
        {
            return PartialView("_CreateInvite", new CreateInvite { InstanceID = InstanceID });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [FindInInstance]
        public ActionResult SendInvite([Bind(Include ="InstanceID,Recipient")] CreateInvite invite, int InstanceID)
        {
            if (ModelState.IsValid)
            {
                if (manager.FindByEmail(invite.Recipient) == null)
                {
                    ModelState.AddModelError("Recipient", "Not a valid user");
                }

                if (invite.Recipient == Generic.GetUserName())
                {
                    ModelState.AddModelError("Recipient", "Cannot invite yourself");
                }

                //now see if another invite already exists for this instance and user and is active.
                var existing = db.Invites.Any(x => x.Accepted == null && x.Active && x.Recipient == invite.Recipient && x.InstanceID == invite.InstanceID);
                if (existing)
                {
                    ModelState.AddModelError("Recipient", "User has a pending invite.");
                }

                //and of course, confirm that user doesn't already exist in the instance.
                existing = db.Members.Any(x => x.InstanceID == invite.InstanceID && x.UserName == invite.Recipient);
                if (existing)
                {
                    ModelState.AddModelError("Recipient", "User is already a member.");
                }

                if (ModelState.IsValid)
                {
                    var newInvite = new Invite(invite);
                    db.Invites.Add(newInvite);
                    db.SaveChanges();
                    return Json(new { refresh = true });
                }
            }
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ReplyInvite(int InviteID, bool Accept)
        {
            var thisInv = db.Invites.Find(InviteID);
            if (thisInv == null || thisInv.Active == false)
            {
                ModelState.AddModelError("Recipient", "Could not find invite.");
            } else if (thisInv.Recipient != Generic.GetUserName())
            {
                ModelState.AddModelError("Recipient", "Could not find invite.");
            } else
            {
                var inst = db.Instances.Include("Members").FirstOrDefault(x=> x.Active && x.InstanceID == thisInv.InstanceID);
                if (inst == null || inst.Members.Any(x => x.UserName == thisInv.Sender) == false)
                {
                    ModelState.AddModelError("Instance", "No Instance found!");
                }
                else
                {
                    if (Accept)
                    {
                        var mem = new Member { InstanceID = inst.InstanceID, UserName = Generic.GetUserName() };
                        db.Members.Add(mem);
                    }
                    thisInv.Reply(Accept);
                    db.SaveChanges();
                }
                return Json(new { refresh = true });
            }
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult RejectInvite(int InviteID)
        {
            var thisInv = db.Invites.Find(InviteID);
            if (thisInv == null || thisInv.Active == false)
            {
                ModelState.AddModelError("Recipient", "Could not find invite.");
            }
            else if (thisInv.Recipient != Generic.GetUserName())
            {
                ModelState.AddModelError("Recipient", "Could not find invite.");
            }
            else
            {
                thisInv.Active = false;
                db.SaveChanges();
                return Json(new { refresh = true });
            }
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }
        #endregion
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        [FindInInstance]
        public ActionResult Genxyz(int InstanceID)
        {
            //clean this up a little later.
            ViewBag.Instance = InstanceID;
            //find if there's any layers linked to this Instance, otherwise, create one.
            var Layers = db.Layers.Any(x => x.InstanceID == InstanceID && x.Active);
            if (!Layers)
            {
                var layer = new Layer ( new CreateLayer { Name="Default", InstanceID=InstanceID } );
                db.Layers.Add(layer);
                db.SaveChanges();
                var Nodes = db.Nodes.Where(x => x.InstanceID == InstanceID && x.Active);
                foreach (var n in Nodes)
                {
                    db.LayerLinks.Add(new LayerLink ( new CreateLayerLink { NodeID = n.NodeID, LayerID = layer.LayerID }));
                }
                db.SaveChanges();
            }
            Response.AppendHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
            Response.AppendHeader("Pragma", "no-cache"); // HTTP 1.0.
            Response.AppendHeader("Expires", "0"); // Proxies.
            return View("Genxyz");
        }

        [FindInInstance]
        public ActionResult Configure(int InstanceID)
        {
            return View("Genxyz");
        }

        //the full initial grab here.
        [HttpPost]
        [FindInInstance]
        [ValidateAntiForgeryToken]
        public ActionResult GetInitialData(int InstanceID)
        {
            var nodes = GetNodes(InstanceID);
            var links = GetLinks(InstanceID);
            var layers = GetLayers(InstanceID);
            var layerLinks = GetLayerLinks(InstanceID);

            CommitTimeStamp();
            return Json(new
            {
                nodes = (nodes.Count() == 0 ? null : nodes),
                links = (links.Count() == 0 ? null : links),
                layers = (layers.Count() == 0 ? null : layers),
                layerLinks = (layerLinks.Count() == 0 ? null : layerLinks)
            });
        }

        #region sub initializers.

        public List<Node> GetNodes(int InstanceID)
        {
            var nodes = db.Nodes.Where(x => x.InstanceID == InstanceID && x.Active).ToList();
            foreach (var n in nodes)
            {
                UpdateTimeStamp(n.LastModified);
            }

            return nodes;
        }

        public List<Link> GetLinks(int InstanceID)
        {
            var nodes = db.Nodes.Where(x => x.InstanceID == InstanceID);
            var links = db.Links.Where(x => nodes.Where(y => y.NodeID == x.OriginID).Count() > 0 && x.Active).ToList();
            foreach (var l in links)
            {
                UpdateTimeStamp(l.LastModified);
            }
            return links;
        }

        public List<JsonLayer> GetLayers(int InstanceID)
        {
            var layers = db.Layers.Where(x => x.Active && x.InstanceID == InstanceID).ToList();
            List<LayerLink> layerLinks = new List<LayerLink>();

            var jsonLayers = new List<JsonLayer>();

            foreach (var l in layers)
            {
                UpdateTimeStamp(l.LastModified);
                layerLinks.AddRange(db.LayerLinks.Where(x => x.LayerID == l.LayerID && x.Active).ToList());
                jsonLayers.Add(new JsonLayer(l));
            }

            return jsonLayers;
        }

        public List<JsonLayerLink> GetLayerLinks(int InstanceID)
        {
            var layers = db.Layers.Where(x => x.Active && x.InstanceID == InstanceID).ToList();
            List<LayerLink> layerLinks = new List<LayerLink>();

            var jsonLayers = new List<JsonLayer>();

            foreach (var l in layers)
            {
                layerLinks.AddRange(db.LayerLinks.Where(x => x.LayerID == l.LayerID && x.Active).ToList());
            }

            var jsonLinks = new List<JsonLayerLink>();

            foreach (var x in layerLinks)
            {
                UpdateTimeStamp(x.LastModified);
                jsonLinks.Add(new JsonLayerLink(x));
            }
            return jsonLinks;
        }
        #endregion

        //the full update option here.
        [HttpPost]
        [FindInInstance]
        [ValidateAntiForgeryToken]
        public ActionResult GetUpdates(int InstanceID)
        {
            CommitTimeStamp();
            var nodes = GetNodeUpdates(InstanceID);
            var links = GetLinksUpdate(InstanceID);
            var layers = GetLayersUpdate(InstanceID);
            var layerLinks = GetLayerLinksUpdate(InstanceID);
            CommitTimeStamp();
            if (nodes.Count() + links.Count() + layers.Count() + layerLinks.Count() == 0)
            {
                return Json(new { update = "false" });
            } else
            {
                return Json(new
                {
                    update = "true",
                    nodes = (nodes.Count() == 0 ? null : nodes),
                    links = (links.Count() == 0 ? null : links),
                    layers = (layers.Count() == 0 ? null : layers),
                    layerLinks = (layerLinks.Count() == 0 ? null : layerLinks)
                });
            }
            
        }

        #region subupdaters.
        //get the nodes here.
        private List<Node> GetNodeUpdates(int InstanceID)
        {
            List<Node> nodes = db.Nodes.Where(x => x.LastModified > Time && x.InstanceID == InstanceID).OrderBy(x => x.LastModified).ToList();
            if (nodes.Count > 0)
            {
                foreach (var n in nodes)
                {
                    UpdateTimeStamp(n.LastModified);
                }
            }
            return nodes;
        }

        //get the links here.
        public List<Link> GetLinksUpdate(int InstanceID)
        {
            var nodes = db.Nodes.Where(x => x.InstanceID == InstanceID);
            var links = db.Links.Where(x => nodes.Where(y => y.NodeID == x.OriginID).Count() > 0 && x.LastModified > Time).ToList();
            if (links.Count > 0)
            {
                foreach (var l in links)
                {
                    UpdateTimeStamp(l.LastModified);
                }
            }
            return links;
        }

        public List<JsonLayer> GetLayersUpdate(int InstanceID)
        {
            //filter out the layers.
            var instanceLayers = db.Layers.Where(x => x.InstanceID == InstanceID).ToList();
            var layers = instanceLayers.Where(x => x.LastModified > Time).ToList();
            

            var jsonLayers = new List<JsonLayer>();
            foreach (var l in layers)
            {
                jsonLayers.Add(new JsonLayer(l));
                UpdateTimeStamp(l.LastModified);
            }

            return jsonLayers;
        }

        public List<JsonLayerLink> GetLayerLinksUpdate(int InstanceID)
        {
            var instanceLayers = db.Layers.Where(x => x.InstanceID == InstanceID).ToList();
            List<LayerLink> layerLinks = new List<LayerLink>();

            foreach (var x in instanceLayers)
            {
                layerLinks.AddRange(x.LayerLinks.Where(y => y.LastModified > Time));
            }

            var jsonLinks = new List<JsonLayerLink>();
            foreach (var x in layerLinks)
            {
                jsonLinks.Add(new JsonLayerLink(x));
                UpdateTimeStamp(x.LastModified);
            }
            return jsonLinks;
        }
        #endregion

        

        public void UpdateTimeStamp(DateTime target)
        {
            //find the newest data - from either nodes, layers or whatever.
            if (target > TempTime)
            {
                Session["TempTimeStamp"] = target;
            }
        }

        public void CommitTimeStamp()
        {
            Session["TimeStamp"] = Session["TempTimeStamp"];
        }
        
    }
}
