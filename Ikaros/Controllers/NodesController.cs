using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Genxyz.Models;

namespace Genxyz.Controllers
{
    public class NodesController : Controller
    {
        private ApplicationDbContext db = new ApplicationDbContext();



        public NodesController()
        {

        }
        //admin features... gotta add protection later. We'll get there.
        public ActionResult CleanNodes()
        {
            var LayerLinks = db.LayerLinks.Where(x => x.Active).ToList();
            var Nodes = db.Nodes.Where(x => x.Active).ToList();
            List<Node> NodesToClean = new List<Node>();
            foreach (var n in Nodes)
            {
                if (!LayerLinks.Any(x=>x.NodeID == n.NodeID))
                {
                    NodesToClean.Add(n);
                }
            }

            foreach (var n in NodesToClean)
            {
                //first check to see if instance has any layers to begin with.
                var Layer = db.Layers.DefaultIfEmpty(null).FirstOrDefault(x => x.InstanceID == n.InstanceID);
                if (Layer == null)
                {
                    Layer = new Layer(new CreateLayer
                    {
                        InstanceID = n.InstanceID,
                        Name = "Default"
                    });
                    db.Layers.Add(Layer);
                    db.SaveChanges();
                }
                db.LayerLinks.Add(
                new LayerLink(
                    new CreateLayerLink
                    {
                        NodeID = n.NodeID,
                        LayerID = Layer.LayerID
                    }));
            }
            db.SaveChanges();
            return RedirectToAction("","Home");
        }

        public ActionResult DeleteInactive()
        {
            //delete all inactive layerlinks, layers and nodes.
            var layerLinks = db.LayerLinks.RemoveRange(db.LayerLinks.Where(x => x.Active == false));
            var Nodes = db.Nodes.RemoveRange(db.Nodes.Where(x => x.Active == false));
            var Layers = db.Layers.RemoveRange(db.Layers.Where(x => x.Active == false));
            db.SaveChanges();
            return RedirectToAction("", "Home");
        }

        //create a layer
        [HttpPost]
        [FindInInstance]
        [ValidateAntiForgeryToken]
        public ActionResult CreatePath([Bind]CreateLayer c, int InstanceID)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            var layer = new Layer(c);
            db.Layers.Add(layer);
            db.SaveChanges();
            //crate layer links, if appropriate.
            List<LayerLink> LayerLinks = new List<LayerLink>();
            if (c.Nodes != null)
            {
                foreach (var x in c.Nodes)
                {
                    var node = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(y => y.NodeID == x && y.InstanceID == InstanceID);
                    if (node == null)
                    {
                        continue;
                    }
                    var thisLink = new LayerLink(new CreateLayerLink { LayerID = layer.LayerID, NodeID = x });
                    LayerLinks.Add(thisLink);
                }
            db.LayerLinks.AddRange(LayerLinks);
            db.SaveChanges();
            }

            var jsonLinks = new List<JsonLayerLink>();
            foreach (var l in LayerLinks)
            {
                jsonLinks.Add(new JsonLayerLink(l));
            }
            return Json(new
            {
                layer = new JsonLayer(layer),
                layerLinks = jsonLinks
            });
        }

/*        //create the nodes!
        public ActionResult CreateNode(int InstanceID, int parentID = -1, int siblingID = -1, int posX = 0, int posY = 0)
        {
            CreateNode node = new CreateNode{ParentNodeID = parentID, SiblingNodeID = siblingID, xPos = posX, yPos = posY, InstanceID = InstanceID};
            return PartialView("_CreateNode", node);
        }*/

        [ValidateAntiForgeryToken]
        [HttpPost]
        [FindInInstance]
        public ActionResult CreateNode([Bind] CreateNode Node, int InstanceID)
        {
            if (ModelState.IsValid)
            {
                //make sure the layer exists in this instance.
                var Layer = db.Layers.DefaultIfEmpty(null).FirstOrDefault(x => x.InstanceID == Node.InstanceID && x.LayerID == Node.LayerID);
                if (Layer == null)
                {
                    ModelState.AddModelError("Layer", "Unable to find Layer.");
                    return Json(new { error = Generic.GetValidationErrors(ModelState) });
                }
                //

                Node node = new Node(Node);
                db.Nodes.Add(node);
                node.Links = new List<Link>();
                db.SaveChanges();
                Link Link = null;
                //create a link if needed.
                if (Node.ParentNodeID != null)
                {
                    CreateLink l = new CreateLink
                    {
                        OriginID = (int) Node.ParentNodeID,
                        TargetID = node.NodeID,
                        Type = "Parent"
                    };
                    Link = new Link(l);
                    db.Links.Add(Link);
                    db.SaveChanges();
                }


                if (Node.SiblingNodeID != null)
                {
                    CreateLink l = new CreateLink
                    {
                        OriginID = (int)Node.ParentNodeID,
                        TargetID = node.NodeID,
                        Type = "Sibling"
                    };
                    Link = new Link(l);
                    db.Links.Add(Link);
                    //node.Links.Add(l);
                    db.SaveChanges();
                }

                //link to the layer.
                var layerLink = new LayerLink(new CreateLayerLink { NodeID = node.NodeID, LayerID = Node.LayerID });
                db.LayerLinks.Add(layerLink);
                db.SaveChanges();
                return Json(new { node= node, layerlink = new JsonLayerLink(layerLink), link = Link});
            }
            
            return Json (new { error = Generic.GetValidationErrors(ModelState)});
        }

        [FindInInstance]
        public ActionResult DeleteNode(int InstanceID, int nodeId){
            return PartialView("_DeleteNode", db.Nodes.Where(x=>x.InstanceID == InstanceID).FirstOrDefault(x=>x.NodeID == nodeId));
        }

        //remove links.
        [FindInInstance]
        [HttpPost]
        public ActionResult RemoveLinks(int InstanceID, int nodeId)
        {
            RemoveLinks(nodeId);

            return Json(new { success = "Success!" });
        }

        [FindInInstance]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult RemoveLink(int InstanceID, int LinkID)
        {
            var link = db.Links.DefaultIfEmpty(null).FirstOrDefault(x => x.LinkID == LinkID);
            if (link == null)
            {
                ModelState.AddModelError("", "Invalid link.");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            //confirm in instance.
            var node = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(x => x.NodeID == link.OriginID && x.InstanceID == InstanceID);
            if (node == null)
            {
                ModelState.AddModelError("", "Invalid link.");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            link.Active = false;
            db.SaveChanges();
            return Json(new { success = "Success!" });
        }

        //delete node.
        [HttpPost]
        [ActionName("DeleteNodes")]
        [FindInInstance]
        public ActionResult DeleteNodePost(int[] NodeIDs, int InstanceID)   {
            foreach (int i in NodeIDs)
            {
                var node = db.Nodes.Where(x => x.InstanceID == InstanceID).FirstOrDefault(x => x.NodeID == i);
                if (node == null)
                {
                    ModelState.AddModelError("", "Node "+i+" not found");
                } else
                {
                    RemoveLinks(i);
                    RemoveLayerLinks(i);
                    node.DeleteNode();
                }
            }
            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            db.SaveChanges();
            //now clear out all the links.
            return Json(new { success = "Success!" });
        }

        //remove a link between a node and a layer. used inside controller, not reachable from outside.
        //probably going to move to node model instead.
        private void RemoveLayerLinks(int nodeID)
        {
            List<LayerLink> LinksToRemove = db.LayerLinks.Where(x => x.NodeID == nodeID).ToList();
            LinksToRemove.ForEach(x => x.RemoveLayerLink());
        }

        //Remove links.
        public bool RemoveLinks(int nodeId)
        {
            List<Link> LinksToRemove = db.Links.Where(x => x.OriginID == nodeId || x.TargetID == nodeId).ToList();
            foreach (var l in LinksToRemove)
            {
                l.RemoveLink();
            }
            db.SaveChanges();

            return true;
        }

        [FindInInstance]
        public ActionResult EditNode(int nodeId, int InstanceID)
        {
            return PartialView("_EditNode", db.Nodes.Where(x=>InstanceID == x.InstanceID).FirstOrDefault(x=>x.NodeID == nodeId));
        }

        //Edit a node.
        [HttpPost]
        [FindInInstance]
        public ActionResult UpdateNode([Bind]EditNode Node, int InstanceID)
        {
            if (InstanceID == Node.InstanceID)
            {
                if (ModelState.IsValid)
                {
                    var node = db.Nodes.Find(Node.NodeID);

                    node.EditNode(Node);
                    
                    db.SaveChanges();
                    return Json(node);
                }
                else
                {
                    return Json(new { error = Generic.GetValidationErrors(ModelState) });
                }
            }
            ModelState.AddModelError("Error", "Error on update.");
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }

        //create a link between two nodes.
        [HttpPost]
        public ActionResult CreateLink([Bind(Include="OriginID, TargetID, Type")] CreateLink Link)
        {
            List<object> errors = new List<object>();
            //ensure tar gets are in the same instance.
            var oNode = db.Nodes.Find(Link.OriginID);
            var tNode = db.Nodes.Find(Link.TargetID);
            if (oNode.InstanceID == tNode.InstanceID)
            {
                //ensure user is in an appropraite instance too.
                var username = Generic.GetUserName();
                var instance = db.Instances.Include("Members").First(x=> x.InstanceID == oNode.InstanceID);
                if (instance.Members.Any(x => x.UserName == username))
                {
                    if (ModelState.IsValid)
                    {
                        db.Links.Add(new Models.Link(Link));
                        db.SaveChanges();
                        return Json(Link);
                    }
                }
                ModelState.AddModelError("Error", "Invalid link");

            } else
            {
                ModelState.AddModelError("Error", "Invalid link");
            }
            
            return Json(new { error = Generic.GetValidationErrors(ModelState) });
        }

        //assigns the layer to a specific node.
        [HttpPost]
        [FindInInstance]
        public ActionResult AssignLayer(int[] NodeID, int LayerID, int InstanceID)
        {
            //first find the node and the layer in the same instance.
            if (NodeID.Length == 0)
            {
                return Json(new { success = true });
            }
            //now remove any that aren't in the appropriate instance.

            bool found = db.Layers.Any(x => x.LayerID == LayerID && x.InstanceID == InstanceID);
            if (!found)
            {
                ModelState.AddModelError("Layer", "Invalid Layer.");
            }

            List<int> Nodes = new List<int>();
            foreach (var x in NodeID)
            {
                var thisNode = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(y => y.NodeID == x && y.InstanceID == InstanceID && y.Active);
                if (thisNode != null)
                {
                    Nodes.Add(x);
                }
            }

            if (Nodes.Count() == 0)
            {
                ModelState.AddModelError("Nodes", "No Nodes Found.");
            }

            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            foreach (var i in Nodes)
            {
                var thisLink = new LayerLink(new CreateLayerLink { LayerID = LayerID, NodeID = i });
                if (thisLink.LayerLinkID != 0)
                {
                    var link = db.LayerLinks.Find(thisLink.LayerLinkID);
                    link = thisLink;
                }
                else
                {
                    db.LayerLinks.Add(thisLink);
                }
            }
            db.SaveChanges();
            return Json(new { success = true });
        }

        [HttpPost]
        [FindInInstance]
        public ActionResult RemoveFromLayer(RemoveLayerLink l, int InstanceID)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            var node = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(x=> x.NodeID == l.NodeID && x.InstanceID == InstanceID);
            if (node == null)
            {
                ModelState.AddModelError("Node Not Found", "Node Not Found");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            var thisLink = db.LayerLinks.DefaultIfEmpty(null).FirstOrDefault(x => x.NodeID == l.NodeID && x.LayerID == l.LayerID);
            if (thisLink == null)
            {
                ModelState.AddModelError("Link Not Found", "Link Not Found");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }
            var layerLinks = db.LayerLinks.Where(x => x.NodeID == l.NodeID && x.Active).ToList();

            if (layerLinks.Count < 2)
            {
                ModelState.AddModelError("Cannot remove", "Nodes must be assigned to at least one layer");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            thisLink.RemoveLayerLink();
            db.SaveChanges();
            return Json(new { layerLink = new JsonLayerLink(thisLink) });
        }

        // Edit Layer here.
        [HttpPost]
        [FindInInstance]
        public ActionResult EditLayer(EditLayer layer, int InstanceID)
        {
            if (ModelState.IsValid)
            {
                var thisLayer = db.Layers.DefaultIfEmpty(null).FirstOrDefault(x=> x.LayerID == layer.LayerID && x.InstanceID == layer.InstanceID);
                if (thisLayer == null)
                {
                    ModelState.AddModelError("LayerID", "Invalid Layer Selected");
                    return Json(new { error = Generic.GetValidationErrors(ModelState) });
                }

                thisLayer.editLayer(layer);
                db.SaveChanges();
                return Json(new { layer = new JsonLayer(thisLayer) });
            }
            return Json( new { error = Generic.GetValidationErrors(ModelState) });
        }

        //delete layer.
        //a few things need to happen here:
        //confirm there is more than one layer.
        //for any node that is only linked to this layer, move over to another layer.
        //remove all links to this layer.

        [HttpPost]
        [FindInInstance]
        public ActionResult DeleteLayer(DeleteLayer l, int InstanceID)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            //confirm layer exists.
            var layer = db.Layers.DefaultIfEmpty(null).FirstOrDefault(x => x.LayerID == l.LayerID && x.InstanceID == l.InstanceID && x.Active);
            if (layer == null)
            {
                ModelState.AddModelError("Layer", "Layer does not exist.");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            //now count the layers.
            if (db.Layers.Where(x => x.InstanceID == l.InstanceID && x.Active && x.LayerID != layer.LayerID).Count() < 1)
            {
                ModelState.AddModelError("Layer", "There must always be at least one layer.");
                return Json(new { error = Generic.GetValidationErrors(ModelState) });
            }

            //disable this layer.
            layer.deleteLayer();
            db.SaveChanges();
            //find the new target layer's ID.
            var targetLayerID = db.Layers.First(x => x.Active && x.InstanceID == l.InstanceID && x.LayerID != l.LayerID).LayerID;

            //find all layer links.
            var layerLinks = db.LayerLinks.Where(x => x.LayerID == l.LayerID).ToList();
            foreach (var n in layerLinks)
            {
                if (!db.LayerLinks.Any(x=>x.NodeID == n.NodeID && x.LayerLinkID != n.LayerLinkID))
                {
                    //copy node to new layer.
                    db.LayerLinks.Add(new LayerLink(new CreateLayerLink { NodeID = n.NodeID, LayerID = targetLayerID }));
                }
                n.RemoveLayerLink();
            }
            db.SaveChanges();
            return Json(new { layer = new JsonLayer(layer) });
        }



        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
