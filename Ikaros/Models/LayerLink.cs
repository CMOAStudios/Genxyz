using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Genxyz.Models
{
    public class LayerLink
    {
        public virtual int LayerLinkID { get; set; }

        public virtual int LayerID { get; set; }
        public virtual Layer Layer { get; set; }

        public virtual int NodeID { get; set; }
        public virtual Node Node { get; set; }

        public virtual bool Active { get; set; }

        public virtual DateTime CreatedOn { get; set; }
        public virtual DateTime LastModified { get; set; }

        public LayerLink() { }
        public LayerLink(CreateLayerLink c)
        {
            ApplicationDbContext db = new ApplicationDbContext();
            var layerLink = db.LayerLinks.DefaultIfEmpty(null).FirstOrDefault(x => x.LayerID == c.LayerID && x.NodeID == c.NodeID);
            if (layerLink != null)
            {
                LayerLinkID = layerLink.LayerLinkID;
            }
            LayerID = c.LayerID;
            NodeID = c.NodeID;
            Active = true;

            CreatedOn = DateTime.Now;
            LastModified = CreatedOn;
        }

        public void RemoveLayerLink()
        {
            Active = false;
            LastModified = DateTime.Now;
        }
    }

    public class JsonLayerLink
    {
        public virtual int LayerLinkID { get; set; }

        public virtual int LayerID { get; set; }

        public virtual int NodeID { get; set; }

        public virtual bool Active { get; set; }

        public virtual DateTime LastModified { get; set; }
        public JsonLayerLink(LayerLink l)
        {
            LayerLinkID = l.LayerLinkID;
            LayerID = l.LayerID;
            NodeID = l.NodeID;
            Active = l.Active;
            LastModified = l.LastModified;
        }
    }

    public class CreateLayerLink
    {
        [Required]
        public virtual int LayerID { get; set; }

        [Required]
        public virtual int NodeID { get; set; }
    }

    public class RemoveLayerLink : CreateLayerLink
    {

    }
}