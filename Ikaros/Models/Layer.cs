using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Genxyz.Models
{
    public class Layer
    {
        public int LayerID { get; set; }

        [Required]
        public virtual string Name { get; set; }

        [Required]
        public virtual int InstanceID { get; set; }
        public virtual Instance Instance { get; set; }

        public virtual List<LayerLink> LayerLinks { get; set; }

        [Required]
        public virtual bool Active { get; set; }

        public virtual DateTime CreatedOn { get; set; }
        public virtual DateTime LastModified { get; set; }

        public Layer() { }

        public Layer(CreateLayer l)
        {
            Active = true;
            Name = l.Name;
            InstanceID = l.InstanceID;
            CreatedOn = DateTime.Now;
            LastModified = CreatedOn;
        }

        public void editLayer(EditLayer l)
        {
            Name = l.Name;
            LastModified = DateTime.Now;
        }

        public void deleteLayer()
        {
            LastModified = DateTime.Now;
            Active = false;
        }
    }

    public class JsonLayer
    {
        public int LayerID { get; set; }

        public string Name { get; set; }

        public bool Active { get; set; }

        public DateTime LastModified { get; set; }

        public JsonLayer(Layer l)
        {
            LayerID = l.LayerID;
            Name = l.Name;
            Active = l.Active;
            LastModified = l.LastModified;
        }
    }

    public class CreateLayer
    {
        [Required]
        public virtual string Name { get; set; }

        [Required]
        public virtual int InstanceID { get; set; }

        public virtual List<int> Nodes { get; set; }
    }

    public class EditLayer
    {
        [Required]
        public int LayerID { get; set; }

        [Required]
        public virtual string Name { get; set; }

        [Required]
        public virtual int InstanceID { get; set; }
    }

    public class DeleteLayer
    {
        [Required]
        public int LayerID { get; set; }

        [Required]
        public virtual int InstanceID { get; set; }
    }
}