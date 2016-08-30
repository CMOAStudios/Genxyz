using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Genxyz.Models
{
    public class Node
    {
        public int NodeID { get; set; }
        public int InstanceID { get; set; }

        public string Name { get; set; }
        public string Comments { get; set; }

        public float xPos { get; set; }
        public float yPos { get; set; }
        public float zPos { get; set; }

        public List<int> LinksID { get; set; } 
        public List<Link> Links { get; set; }

        public bool Active { get; set; }

        public DateTime CreatedOn { get; set; }
        public DateTime LastModified { get; set; }

        public Node()
        {

        }

        public Node(CreateNode n)
        {
            Name = n.Name;
            Comments = n.Comments;
            xPos = n.xPos;
            yPos = n.yPos;
            zPos = n.zPos;
            InstanceID = n.InstanceID;
            Active = true;

            CreatedOn = DateTime.Now;
            LastModified = DateTime.Now;
        }

        public void EditNode(EditNode n)
        {
            Name = n.Name;
            Comments = n.Comments;
            xPos = n.xPos;
            yPos = n.yPos;
            zPos = n.zPos;

            LastModified = DateTime.Now;
        }

        public void DeleteNode()
        {
            if (Active)
            {
                Active = false;
                LastModified = DateTime.Now;
            }
        }

        public void ActivateNode()
        {
            if (!Active)
            {
                Active = true;
                LastModified = DateTime.Now;
            }
        }
    }

    public class CreateNode
    {
        public int? ParentNodeID { get; set; }
        public int? SiblingNodeID { get; set; }

        [Required]
        public string Name { get; set; }
        public string Comments { get; set; }

        [Required]
        public float xPos { get; set; }
        [Required]
        public float yPos { get; set; }
        [Required]
        public float zPos { get; set; }

        [Required]
        public virtual int LayerID { get; set; }

        public int InstanceID { get; set; }
    }

    public class EditNode
    {
        public int NodeID { get; set; }
        public int InstanceID { get; set; }

        [Required]
        [Display(Name="Title", Prompt ="Title")]
        public string Name { get; set; }
        [Display(Name="Description", Prompt ="Description")]
        public string Comments { get; set; }

        [Required]
        [Display(Name="X")]
        public float xPos { get; set; }
        [Required]
        [Display(Name = "Y")]
        public float yPos { get; set; }
        [Required]
        [Display(Name = "Z")]
        public float zPos { get; set; }
    }
}